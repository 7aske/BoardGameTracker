import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { t } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import { useToast } from '@/providers/BgtToastProvider';
import { CreateLocation, CreateLocationSchema } from '@/models';
import { useLocations } from '@/hooks/useLocations';
import { BgtInputField } from '@/components/BgtForm/BgtInputField';
import { BgtDialog, BgtDialogContent, BgtDialogTitle, BgtDialogClose } from '@/components/BgtDialog/BgtDialog';
import BgtButton from '@/components/BgtButton/BgtButton';

interface Props {
  open: boolean;
  close: () => void;
}

export const NewLocationModal = (props: Props) => {
  const { open, close } = props;
  const { showInfoToast, showErrorToast } = useToast();
  const { t } = useTranslation();

  const onNewSuccess = () => {
    showInfoToast('location.notifications.created');
    close();
  };
  const onNewFailed = () => {
    showErrorToast('location.notifications.create-failed');
  };
  const { save } = useLocations({ onNewSuccess, onNewFailed });
  const { handleSubmit, control } = useForm<CreateLocation>({
    resolver: zodResolver(CreateLocationSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: CreateLocation) => {
    await save(data);
  };

  return (
    <BgtDialog open={open}>
      <BgtDialogContent>
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="w-full">
          <BgtDialogTitle>{t('location.new.title')}</BgtDialogTitle>
          <div className="flex flex-col gap-2 mb-3">
            <BgtInputField type="text" control={control} name="name" label={t('location.new.name.placeholder')} />
          </div>
          <BgtDialogClose>
            <BgtButton variant="soft" color="cancel" onClick={() => close()}>
              {t('common.cancel')}
            </BgtButton>
            <BgtButton color="primary" type="submit">
              {t('common.save')}
            </BgtButton>
          </BgtDialogClose>
        </form>
      </BgtDialogContent>
    </BgtDialog>
  );
};
