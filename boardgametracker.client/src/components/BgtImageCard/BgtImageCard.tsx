import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dispatch, SetStateAction, useState } from 'react';
import { t } from 'i18next';
import { cx } from 'class-variance-authority';

import { BgtDeleteModal } from '../Modals/BgtDeleteModal';
import { BgtText } from '../BgtText/BgtText';
import { BgtHiddenEditDropdown } from '../BgtDropdown/BgtEditDropdown';
import { getColorFromGameState, getItemStateTranslationKey } from '../../utils/ItemStateUtils';

import { StringToRgb } from '@/utils/stringUtils';
import { useToast } from '@/providers/BgtToastProvider';
import { EditPlayerModal } from '@/pages/Players/modals/EditPlayerModal';
import { usePlayers } from '@/pages/Players/hooks/usePlayers';
import { usePlayer } from '@/pages/Players/hooks/usePlayer';
import { useGames } from '@/pages/Games/hooks/useGames';
import { GameState } from '@/models';

interface Props {
  title: string;
  state?: GameState;
  image: string | null;
  link: string;
  id: string;
}

interface GameCardProps extends Props {
  openDeleteModal: boolean;
  setOpenDeleteModal: Dispatch<SetStateAction<boolean>>;
  deleteAction: (id: string) => Promise<void>;
  modalDescription: string;
  callUpdate: () => void;
}

export const BgtGameImageCard = (props: Props) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const navigate = useNavigate();
  const { showInfoToast } = useToast();

  const onDeleteSuccess = () => {
    setOpenDeleteModal(false);
    showInfoToast(t('game.notifications.deleted'));
  };

  const { deleteGame } = useGames({ onDeleteSuccess });

  return (
    <BgtImageCard
      {...props}
      setOpenDeleteModal={setOpenDeleteModal}
      openDeleteModal={openDeleteModal}
      deleteAction={deleteGame}
      modalDescription={t('common.delete.description', { title: props.title })}
      callUpdate={() => navigate(`/games/${props.id}/update`)}
    />
  );
};

export const BgtPlayerImageCard = (props: Props) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const { showInfoToast } = useToast();

  const onDeleteSuccess = () => {
    setOpenDeleteModal(false);
    showInfoToast(t('player.notifications.deleted'));
  };
  const onDeleteError = () => {
    setOpenDeleteModal(false);
    showInfoToast(t('player.notifications.delete-failed'));
  };

  const { deletePlayer } = usePlayers({ onDeleteSuccess, onDeleteError });
  const { player } = usePlayer({ id: props.id });

  if (player.data === undefined) return null;

  return (
    <>
      <BgtImageCard
        {...props}
        setOpenDeleteModal={setOpenDeleteModal}
        openDeleteModal={openDeleteModal}
        deleteAction={deletePlayer}
        modalDescription={t('player.delete.description', { name: props.title })}
        callUpdate={() => setOpenUpdateModal(true)}
      />
      <EditPlayerModal open={openUpdateModal} setOpen={setOpenUpdateModal} player={player.data} />
    </>
  );
};

const BgtImageCard = (props: GameCardProps) => {
  const {
    title,
    image,
    state = null,
    link,
    id,
    setOpenDeleteModal,
    openDeleteModal,
    callUpdate,
    deleteAction,
    modalDescription,
  } = props;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col justify-center cursor-pointer flex-nowrap relative gap-1 group">
      <Link to={link}>
        <div
          style={{ '--image-url': `url(${image})`, '--fallback-color': StringToRgb(title) }}
          className={cx(
            'w-full relative overflow-hidden aspect-square z-10 rounded-xl flex flex-col justify-center',
            `bg-cover bg-no-repeat bg-center`,
            image && 'bg-[image:var(--image-url)]',
            !image && `bg-[var(--fallback-color)]`
          )}
        >
          {!image && (
            <span className="flex justify-center align-middle h-max font-bold text-3xl capitalize">{title[0]}</span>
          )}
        </div>
      </Link>
      <div className="flex flex-row justify-between items-end">
        <div className="flex flex-col items-start justify-start">
          <Link to={link}>
            {state !== null && (
              <BgtText
                size="1"
                className="line-clamp-1 uppercase w-full"
                weight="medium"
                color={getColorFromGameState(state)}
              >
                {t(getItemStateTranslationKey(state))}
              </BgtText>
            )}
            <BgtText size="4" className="line-clamp-1 uppercase w-full" weight="medium">
              {title}
            </BgtText>
          </Link>
        </div>
        <BgtHiddenEditDropdown onDelete={() => setOpenDeleteModal(true)} onEdit={() => callUpdate()} />
      </div>
      <BgtDeleteModal
        title={title}
        open={openDeleteModal}
        close={() => setOpenDeleteModal(false)}
        onDelete={() => deleteAction(id)}
        description={modalDescription}
      />
    </div>
  );
};
