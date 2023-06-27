﻿using BoardGameTracker.Common.Entities.Helpers;

namespace BoardGameTracker.Common.Entities;

public class GameMechanic : HasId
{
    public string Name { get; set; }
    public ICollection<Game> Games { get; set; }
}