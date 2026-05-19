import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  makeSelectEffectiveRole,
  selectActiveOffering,
  selectActiveOfferingError,
  selectActiveOfferingLoading,
} from '@/store/selectors/courseShellSelectors';
import type { User } from '@/services/types';
import { parseOfferingIdParam } from '@/lib/routing';
import { fetchActiveOffering } from '@/store/slices/activeOfferingSlice';
import {
  setViewAsStudentForOffering,
  toggleViewAsStudentForOffering,
} from '@/store/slices/courseUiSlice';

/**
 * Reads course offering state from Redux for /courses/:offeringId/* routes.
 */
export function useCourseShell() {
  const { offeringId: param } = useParams<{ offeringId: string }>();
  const dispatch = useAppDispatch();

  const parsedId = parseOfferingIdParam(param);
  const offeringId = parsedId !== undefined ? parsedId : null;

  const offering = useAppSelector(selectActiveOffering);
  const loading = useAppSelector(selectActiveOfferingLoading);
  const error = useAppSelector(selectActiveOfferingError);
  const user = useAppSelector((s) => s.user.user) as User | null;

  const selectEr = useMemo(
    () =>
      offeringId !== null
        ? makeSelectEffectiveRole(offeringId)
        : () => undefined,
    [offeringId],
  );
  const roleFromCourse = useAppSelector(selectEr);
  const effectiveRole =
    offeringId !== null
      ? roleFromCourse ?? user?.role
      : user?.role;

  const viewAsStudent = useAppSelector((s) =>
    offeringId !== null
      ? (s.courseUi.viewAsStudentByOfferingId[offeringId] ?? false)
      : false,
  );

  const refetch = async () => {
    if (offeringId !== null) {
      await dispatch(fetchActiveOffering(offeringId));
    }
  };

  const toggleViewAsStudent = () => {
    if (offeringId !== null) {
      dispatch(toggleViewAsStudentForOffering(offeringId));
    }
  };

  const setViewAsStudent = (value: boolean) => {
    if (offeringId !== null) {
      dispatch(setViewAsStudentForOffering({ offeringId, value }));
    }
  };

  return {
    offering,
    loading,
    error,
    effectiveRole,
    viewAsStudent,
    toggleViewAsStudent,
    setViewAsStudent,
    refetch,
    offeringId,
  };
}
