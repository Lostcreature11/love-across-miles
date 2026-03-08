import { useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export const useNotifications = () => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const notify = useCallback((title: string, body: string) => {
    // In-app toast
    toast({ title, description: body });

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, []);

  return { notify };
};
