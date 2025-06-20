﻿using BoardGameTracker.Common.Entities;
using BoardGameTracker.Common.Entities.Helpers;
using BoardGameTracker.Common.Enums;
using BoardGameTracker.Common.Extensions;
using BoardGameTracker.Core.Datastore;
using BoardGameTracker.Core.Games.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BoardGameTracker.Core.Games;

public class GameRepository : CrudHelper<Game>, IGameRepository
{
    private readonly MainDbContext _context;

    public GameRepository(MainDbContext context): base(context)
    {
        _context = context;
    }

    public async Task AddGameCategoriesIfNotExists(IEnumerable<GameCategory> categories)
    {
        await _context.GameCategories.AddRangeIfNotExists(categories);
        await _context.SaveChangesAsync();
    }

    public async Task AddGameMechanicsIfNotExists(IEnumerable<GameMechanic> mechanics)
    {
        await _context.GameMechanics.AddRangeIfNotExists(mechanics);
        await _context.SaveChangesAsync();
    }

    public async Task AddPeopleIfNotExists(IEnumerable<Person> people)
    {
        await _context.People.AddRangeIfNotExists(people);
        await _context.SaveChangesAsync();
    }

    public override async Task<Game> CreateAsync(Game entity)
    {
        var catIds = entity.Categories.Select(x => x.Id);
        entity.Categories = await _context.GameCategories.Where(x => catIds.Contains(x.Id)).ToListAsync();

        var mecIds = entity.Mechanics.Select(x => x.Id);
        entity.Mechanics = await _context.GameMechanics.Where(x => mecIds.Contains(x.Id)).ToListAsync();

        var peopleIds = entity.People.Select(x => x.Id);
        entity.People = await _context.People.Where(x => peopleIds.Contains(x.Id)).ToListAsync();

        await _context.Games.AddAsync(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public Task<Game?> GetGameByBggId(int bggId)
    {
        return _context.Games
            .SingleOrDefaultAsync(x => x.BggId == bggId);
    }

    public Task<List<Game>> GetGamesOverviewList()
    {
        return _context.Games
            .OrderBy(x => x.Title)
            .ToListAsync();
    }

    public override Task<Game?> GetByIdAsync(int id)
    {
        return _context.Games
            .Include(x => x.Accessories)
            .Include(x => x.Categories)
            .Include(x => x.Expansions)
            .Include(x => x.Mechanics)
            .Include(x => x.People)
            .SingleOrDefaultAsync(x => x.Id == id);
    }

    public Task<List<Session>> GetSessions(int id, int skip, int? take)
    {
        var query = _context.Sessions
            .Include(x => x.Location)
            .Include(x => x.PlayerSessions)
            .ThenInclude(x => x.Player)
            .Where(x => x.GameId == id)
            .OrderByDescending(x => x.Start)
            .Skip(skip);

        if (take.HasValue)
        {
            query = query.Take(take.Value);
        }

        return query.ToListAsync();
    }

    public Task<int> GetPlayCount(int id)
    {
        return _context.Sessions
            .Where(x => x.GameId == id)
            .CountAsync();
    }

    public async Task<TimeSpan> GetTotalPlayedTime(int id)
    {
        var totalDurationInMinutes = await _context.Sessions
            .Where(x => x.GameId == id)
            .SumAsync(session => (session.End - session.Start).TotalMinutes);

        return TimeSpan.FromMinutes(totalDurationInMinutes);
    }

    public async Task<double?> GetPricePerPlay(int id)
    {
        var games = await _context.Games
            .Include(x => x.Sessions)
            .Where(x => x.Id == id)
            .ToListAsync();

        var game = games.First();
        if (game.Sessions.Count == 0 || !game.BuyingPrice.HasValue)
        {
            return null;
        }

        return Math.Round(game.BuyingPrice.Value / game.Sessions.Count, 2);
    }

    public async Task<DateTime?> GetLastPlayedDateTime(int id)
    {
        if (await _context.Sessions.AnyAsync(x => x.GameId == id))
        {
            return await _context.Sessions
                .Where(x => x.GameId == id)
                .OrderByDescending(x => x.Start)
                .Select(x => x.Start)
                .FirstOrDefaultAsync();
        }

        return null;
    }

    public Task<double?> GetHighestScore(int id)
    {
        return _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id)
            .SelectMany(x => x.PlayerSessions)
            .MaxAsync(x => x.Score);
    }

    public async Task<Player?> GetMostWins(int id)
    {
        var playerSession = await _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id )
            .SelectMany(x => x.PlayerSessions)
            .Where(x => x.Won)
            .GroupBy(x => x.PlayerId)
            .Select(x => new { PlayerId = x.Key, Count = x.Count()})
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync();

        if (playerSession == null)
        {
            return null;
        }

        return await _context.Players.FirstAsync(x => x.Id == playerSession.PlayerId);
    }

    public async Task<Player?> GetMostWins()
    {
        var playerSession = await _context.Sessions
            .Include(x => x.PlayerSessions)
            .SelectMany(x => x.PlayerSessions)
            .Where(x => x.Won)
            .GroupBy(x => x.PlayerId)
            .Select(x => new { PlayerId = x.Key, Count = x.Count()})
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync();

        if (playerSession == null)
        {
            return null;
        }

        return await _context.Players.FirstAsync(x => x.Id == playerSession.PlayerId);
    }

    public Task<double?> GetAverageScore(int id)
    {
        return _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id)
            .SelectMany(x => x.PlayerSessions)
            .AverageAsync(x => x.Score);
    }

    public Task<double> GetAveragePlayTime(int id)
    {
        if (_context.Sessions.Any(x => x.GameId == id))
        {
            return _context.Sessions
                .Include(x => x.PlayerSessions)
                .Where(x => x.GameId == id)
                .AverageAsync(x => (x.End - x.Start).TotalMinutes);
        }

        return Task.FromResult(0d);
    }

    public Task<double?> GetMeanPayedAsync()
    {
        return _context.Games
            .AverageAsync(x => x.BuyingPrice);
    }

    public Task<double?> GetTotalPayedAsync()
    {
        return _context.Games.SumAsync(x => x.BuyingPrice);
    }

    public Task<List<IGrouping<GameState, Game>>> GetGamesGroupedByState()
    {
        return _context.Games
            .GroupBy(x => x.State)
            .ToListAsync();
            
    }

    public Task<List<Session>> GetSessionsByGameId(int id)
    {
        return _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id)
            .ToListAsync();
    }

    public Task<int> CountAsync()
    {
        return _context.Games.CountAsync();
    }

    public async Task<int?> GetShortestPlay(int id)
    {
        var result = await _context.Sessions
            .Where(x => x.GameId == id)
            .OrderBy(x => (x.End - x.Start).TotalSeconds)
            .FirstOrDefaultAsync();

        return result?.Id;
    }

    public async Task<int?> GetLongestPlay(int id)
    {
        var result = await _context.Sessions
            .Where(x => x.GameId == id)
            .OrderByDescending(x => (x.End - x.Start).TotalSeconds)
            .FirstOrDefaultAsync();

        return result?.Id;
    }

    public async Task<int?> GetHighScorePlay(int id)
    {
        var result = await _context.Sessions
            .Include(x => x.PlayerSessions)
            .Include(x => x.Game)
            .Where(x => x.GameId == id && x.Game.HasScoring)
            .SelectMany(x => x.PlayerSessions)
            .OrderByDescending(x => x.Score)
            .FirstOrDefaultAsync();

        return result?.SessionId;
    }

    public async Task<int?> GetLowestScorePlay(int id)
    {
        var result = await _context.Sessions
            .Include(x => x.PlayerSessions)
            .Include(x => x.Game)
            .Where(x => x.GameId == id && x.Game.HasScoring)
            .SelectMany(x => x.PlayerSessions)
            .OrderBy(x => x.Score)
            .FirstOrDefaultAsync();

        return result?.SessionId;
    }

    public Task<int> GetTotalPlayCount(int id)
    {
        return _context.Sessions
            .CountAsync(x => x.GameId == id);
    }

    public Task<List<IGrouping<DayOfWeek, Session>>> GetPlayByDayChart(int id)
    {
        return _context.Sessions
            .Where(x => x.GameId == id)
            .GroupBy(x => x.Start.DayOfWeek)
            .ToListAsync();
    }

    public Task<List<IGrouping<int, int>>> GetPlayerCountChart(int id)
    {
        return _context.Sessions
            .Where(x => x.GameId == id)
            .Select(x => x.PlayerSessions.Count())
            .GroupBy(x => x)
            .ToListAsync();
    }

    public Task<PlayerSession?> GetHighestScoringPlayer(int id)
    {
        return _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id)
            .SelectMany(x => x.PlayerSessions)
            .OrderByDescending(x => x.Score)
            .FirstOrDefaultAsync();
    }

    public Task<PlayerSession?> GetHighestLosingPlayer(int id)
    {
        return _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id)
            .SelectMany(x => x.PlayerSessions)
            .Where(x => !x.Won)
            .OrderByDescending(x => x.Score)
            .FirstOrDefaultAsync();
    }

    public Task<PlayerSession?> GetLowestWinning(int id)
    {
        return _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id)
            .SelectMany(x => x.PlayerSessions)
            .Where(x => x.Won)
            .OrderBy(x => x.Score)
            .FirstOrDefaultAsync();
    }

    public Task<PlayerSession?> GetLowestScoringPlayer(int id)
    {
        return _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id)
            .SelectMany(x => x.PlayerSessions)
            .OrderBy(x => x.Score)
            .FirstOrDefaultAsync();
    }

    public Task<List<Session>> GetSessions(int id, int dayCount)
    {
        return _context.Sessions
            .Include(x => x.PlayerSessions)
            .Where(x => x.GameId == id && x.Start > DateTime.UtcNow.AddDays(dayCount))
            .OrderBy(x => x.Start)
            .ToListAsync();
    }

    public override async Task<Game> UpdateAsync(Game entity)
    {
        var dbGame = await _context.Games.SingleOrDefaultAsync(x => x.Id == entity.Id);
        if (dbGame != null)
        {
            dbGame.HasScoring = entity.HasScoring;
            dbGame.Description = entity.Description;
            dbGame.Image = entity.Image;
            dbGame.Rating = entity.Rating;
            dbGame.State = entity.State;
            dbGame.Title = entity.Title;
            dbGame.Weight = entity.Weight;
            dbGame.BggId = entity.BggId;
            dbGame.BuyingPrice = entity.BuyingPrice;
            dbGame.MaxPlayers = entity.MaxPlayers;
            dbGame.MinAge = entity.MinAge;
            dbGame.MinPlayers = entity.MinPlayers;
            dbGame.SoldPrice = entity.SoldPrice;
            dbGame.YearPublished = entity.YearPublished;
            dbGame.MaxPlayTime = entity.MaxPlayTime;
            dbGame.MinPlayTime = entity.MinPlayTime;
            dbGame.AdditionDate = entity.AdditionDate;

            await _context.SaveChangesAsync();
        }

        return entity;
    }
}