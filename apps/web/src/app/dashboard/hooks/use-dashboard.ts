"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useFileManager } from "@/hooks/use-file-manager";
import { useSecureConfigValue } from "@/hooks/use-secure-configs";
import { useShareManager } from "@/hooks/use-share-manager";
import { getDiskSpace, listFiles, listUserShares } from "@/http/endpoints";
import { ListUserShares200SharesItem } from "@/http/models/listUserShares200SharesItem";

export function useDashboard() {
  const t = useTranslations();
  const [diskSpace, setDiskSpace] = useState<{
    diskSizeGB: number;
    diskUsedGB: number;
    diskAvailableGB: number;
    uploadAllowed: boolean;
  } | null>(null);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [recentShares, setRecentShares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { value: smtpEnabled } = useSecureConfigValue("smtpEnabled");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const onOpenUploadModal = () => setIsUploadModalOpen(true);
  const onCloseUploadModal = () => setIsUploadModalOpen(false);
  const onOpenCreateModal = () => setIsCreateModalOpen(true);
  const onCloseCreateModal = () => setIsCreateModalOpen(false);

  const loadDashboardData = async () => {
    try {
      const [diskSpaceRes, filesRes, sharesRes] = await Promise.all([getDiskSpace(), listFiles(), listUserShares()]);

      setDiskSpace(diskSpaceRes.data);

      const allFiles = filesRes.data.files || [];
      const sortedFiles = [...allFiles].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRecentFiles(sortedFiles.slice(0, 5));

      const allShares = sharesRes.data.shares || [];
      const sortedShares = [...allShares].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRecentShares(sortedShares.slice(0, 5));
    } catch (error) {
      toast.error(t("dashboard.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const fileManager = useFileManager(loadDashboardData);
  const shareManager = useShareManager(loadDashboardData);

  const handleCopyLink = (share: ListUserShares200SharesItem) => {
    if (!share.alias?.alias) return;
    const link = `${window.location.origin}/s/${share.alias.alias}`;

    navigator.clipboard.writeText(link);
    toast.success(t("dashboard.linkCopied"));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    isLoading,
    diskSpace,
    recentFiles,
    recentShares,
    modals: {
      isUploadModalOpen,
      isCreateModalOpen,
      onOpenUploadModal,
      onCloseUploadModal,
      onOpenCreateModal,
      onCloseCreateModal,
    },
    fileManager,
    shareManager,
    handleCopyLink,
    loadDashboardData,
    smtpEnabled: smtpEnabled || "false",
  };
}
