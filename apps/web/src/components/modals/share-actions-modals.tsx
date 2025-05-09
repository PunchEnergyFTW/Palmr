"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { FileSelector } from "@/components/general/file-selector";
import { RecipientSelector } from "@/components/general/recipient-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateSharePassword } from "@/http/endpoints";

export interface ShareActionsModalsProps {
  shareToDelete: any;
  shareToEdit: any;
  shareToManageFiles: any;
  shareToManageRecipients: any;
  onCloseDelete: () => void;
  onCloseEdit: () => void;
  onCloseManageFiles: () => void;
  onCloseManageRecipients: () => void;
  onDelete: (shareId: string) => Promise<void>;
  onEdit: (shareId: string, data: any) => Promise<void>;
  onManageFiles: (shareId: string, files: string[]) => Promise<void>;
  onManageRecipients: (shareId: string, recipients: string[]) => Promise<void>;
  onSuccess: () => void;
}

export function ShareActionsModals({
  shareToDelete,
  shareToEdit,
  shareToManageFiles,
  shareToManageRecipients,
  onCloseDelete,
  onCloseEdit,
  onCloseManageFiles,
  onCloseManageRecipients,
  onDelete,
  onEdit,
  onManageFiles,
  onSuccess,
}: ShareActionsModalsProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    expiresAt: "",
    isPasswordProtected: false,
    password: "",
    maxViews: "",
  });

  useEffect(() => {
    if (shareToEdit) {
      setEditForm({
        name: shareToEdit.name || "",
        expiresAt: shareToEdit.expiration ? new Date(shareToEdit.expiration).toISOString().slice(0, 16) : "",
        isPasswordProtected: Boolean(shareToEdit.security?.hasPassword),
        password: "",
        maxViews: shareToEdit.security?.maxViews?.toString() || "",
      });
    }
  }, [shareToEdit]);

  const handleDelete = async () => {
    if (!shareToDelete) return;
    setIsLoading(true);
    await onDelete(shareToDelete.id);
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!shareToEdit) return;
    setIsLoading(true);

    try {
      const updateData = {
        name: editForm.name,
        expiration: editForm.expiresAt ? new Date(editForm.expiresAt).toISOString() : undefined,
        maxViews: editForm.maxViews ? parseInt(editForm.maxViews) : null,
      };

      await onEdit(shareToEdit.id, updateData);

      if (!editForm.isPasswordProtected && shareToEdit.security.hasPassword) {
        await updateSharePassword(shareToEdit.id, { password: "" });
      } else if (editForm.isPasswordProtected && editForm.password) {
        await updateSharePassword(shareToEdit.id, { password: editForm.password });
      }

      onSuccess();
      onCloseEdit();
      toast.success(t("shareActions.editSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("shareActions.editError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={!!shareToDelete} onOpenChange={() => onCloseDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shareActions.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("shareActions.deleteConfirmation")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseDelete}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" disabled={isLoading} onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareToEdit} onOpenChange={() => onCloseEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shareActions.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label>{t("shareActions.nameLabel")}</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label>{t("shareActions.expirationLabel")}</Label>
              <Input
                placeholder={t("shareActions.expirationPlaceholder")}
                type="datetime-local"
                value={editForm.expiresAt}
                onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label>{t("shareActions.maxViewsLabel")}</Label>
              <Input
                min="1"
                placeholder={t("shareActions.maxViewsPlaceholder")}
                type="number"
                value={editForm.maxViews}
                onChange={(e) => setEditForm({ ...editForm, maxViews: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={editForm.isPasswordProtected}
                onCheckedChange={(checked) =>
                  setEditForm({
                    ...editForm,
                    isPasswordProtected: checked,
                    password: "",
                  })
                }
              />
              <Label>{t("shareActions.passwordProtection")}</Label>
            </div>
            {editForm.isPasswordProtected && (
              <div className="grid w-full items-center gap-1.5">
                <Label>
                  {shareToEdit?.security?.hasPassword
                    ? t("shareActions.newPasswordLabel")
                    : t("shareActions.passwordLabel")}
                </Label>
                <Input
                  placeholder={
                    shareToEdit?.security?.hasPassword
                      ? t("shareActions.newPasswordPlaceholder")
                      : t("shareActions.passwordPlaceholder")
                  }
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseEdit}>
              {t("common.cancel")}
            </Button>
            <Button disabled={isLoading} onClick={handleEdit}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareToManageFiles} onOpenChange={() => onCloseManageFiles()}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{t("shareActions.manageFilesTitle")}</DialogTitle>
          </DialogHeader>
          <FileSelector
            selectedFiles={shareToManageFiles?.files?.map((file: { id: string }) => file.id) || []}
            shareId={shareToManageFiles?.id}
            onSave={async (files) => {
              await onManageFiles(shareToManageFiles?.id, files);
              onSuccess();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareToManageRecipients} onOpenChange={() => onCloseManageRecipients()}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{t("shareActions.manageRecipientsTitle")}</DialogTitle>
          </DialogHeader>
          <RecipientSelector
            selectedRecipients={shareToManageRecipients?.recipients || []}
            shareAlias={shareToManageRecipients?.alias?.alias}
            shareId={shareToManageRecipients?.id}
            onSuccess={onSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
