import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storage, UserData } from '../utils/storage';
import { checkBadgeUnlocks } from '../utils/badges';
import { analytics } from '../utils/analytics';

export const USER_DATA_QUERY_KEY = ['userData'];

export function useUserData() {
  return useQuery({
    queryKey: USER_DATA_QUERY_KEY,
    queryFn: async () => {
      const data = await storage.getUserData();
      return data;
    },
  });
}

export function useLogActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ points, actionIds }: { points: number; actionIds: string[] }) => {
      const updated = await storage.addPoints(points, actionIds);
      const actionCounts = await storage.getActionCounts();
      const newBadges = checkBadgeUnlocks(updated, actionCounts);
      if (newBadges.length > 0) {
        await storage.earnBadges(newBadges.map((b) => b.id));
      }
      analytics.track('habit_logged', { points, actionIds, count: actionIds.length });
      return updated;
    },
    onMutate: async ({ points, actionIds }) => {
      await queryClient.cancelQueries({ queryKey: USER_DATA_QUERY_KEY });
      const previousData = queryClient.getQueryData<UserData>(USER_DATA_QUERY_KEY);

      if (previousData) {
        // Optimistically update
        const newActionsLogged = previousData.actionsLogged + actionIds.length;
        const newTotalPoints = previousData.totalPoints + points;
        const newTodayActions = [...previousData.todayActions, ...actionIds];
        
        queryClient.setQueryData<UserData>(USER_DATA_QUERY_KEY, {
          ...previousData,
          actionsLogged: newActionsLogged,
          totalPoints: newTotalPoints,
          todayActions: newTodayActions,
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(USER_DATA_QUERY_KEY, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
    },
  });
}

export function useRemoveActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ points, actionId }: { points: number; actionId: string }) => {
      return await storage.removeAction(points, actionId);
    },
    onMutate: async ({ points, actionId }) => {
      await queryClient.cancelQueries({ queryKey: USER_DATA_QUERY_KEY });
      const previousData = queryClient.getQueryData<UserData>(USER_DATA_QUERY_KEY);

      if (previousData) {
        queryClient.setQueryData<UserData>(USER_DATA_QUERY_KEY, {
          ...previousData,
          actionsLogged: Math.max(0, previousData.actionsLogged - 1),
          totalPoints: Math.max(0, previousData.totalPoints - points),
          todayActions: previousData.todayActions.filter((id) => id !== actionId),
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(USER_DATA_QUERY_KEY, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
    },
  });
}

export function useJoinTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, companyName }: { teamId: string; companyName: string }) => {
      await storage.updateUserData({ teamId, companyName });
      return { teamId, companyName };
    },
    onMutate: async ({ teamId, companyName }) => {
      await queryClient.cancelQueries({ queryKey: USER_DATA_QUERY_KEY });
      const previousData = queryClient.getQueryData<UserData>(USER_DATA_QUERY_KEY);

      if (previousData) {
        queryClient.setQueryData<UserData>(USER_DATA_QUERY_KEY, {
          ...previousData,
          teamId,
          companyName,
        });
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(USER_DATA_QUERY_KEY, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
    },
  });
}
