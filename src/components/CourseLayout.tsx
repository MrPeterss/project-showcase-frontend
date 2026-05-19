import {
  useParams,
  Outlet,
  useLocation,
  useNavigate,
  matchPath,
} from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { CourseNavBar } from '@/components/CourseNavBar';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchActiveOffering,
  clearActiveOffering,
} from '@/store/slices/activeOfferingSlice';
import { setViewAsStudentForOffering } from '@/store/slices/courseUiSlice';
import {
  canAccessCourseSettingsRoute,
  canAccessSparkOfferingRoute,
} from '@/lib/courseRoleAccess';
import {
  makeSelectEffectiveRole,
  selectActiveOffering,
  selectActiveOfferingLoading,
} from '@/store/selectors/courseShellSelectors';

export function CourseLayout() {
  const { offeringId: offeringIdParam } = useParams<{ offeringId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const { hasAccess: isAuthenticated } = useRoleAccess([
    'ADMIN',
    'INSTRUCTOR',
    'TA',
    'STUDENT',
    'VIEWER',
  ]);

  const parsedId = offeringIdParam ? parseInt(offeringIdParam, 10) : NaN;
  const validOfferingId =
    Number.isFinite(parsedId) && !Number.isNaN(parsedId) ? parsedId : null;

  const offering = useAppSelector(selectActiveOffering);
  const loading = useAppSelector(selectActiveOfferingLoading);
  const selectEffectiveRole = useMemo(
    () =>
      validOfferingId !== null
        ? makeSelectEffectiveRole(validOfferingId)
        : () => undefined,
    [validOfferingId],
  );
  const effectiveRole = useAppSelector(selectEffectiveRole);
  const viewAsStudent = useAppSelector((s) =>
    validOfferingId !== null
      ? (s.courseUi.viewAsStudentByOfferingId[validOfferingId] ?? false)
      : false,
  );

  useEffect(() => {
    if (validOfferingId === null) {
      dispatch(clearActiveOffering());
      return;
    }
    void dispatch(fetchActiveOffering(validOfferingId));
    return () => {
      dispatch(clearActiveOffering());
    };
  }, [dispatch, validOfferingId]);

  const isAdmin = user?.role === 'ADMIN';

  const hasRoleMismatch = useMemo(() => {
    if (!user || !effectiveRole) return false;
    if (user.role !== 'ADMIN' && effectiveRole === 'ADMIN') {
      return true;
    }
    if (user.role === 'STUDENT' && effectiveRole === 'ADMIN') {
      return true;
    }
    return false;
  }, [user, effectiveRole]);

  useEffect(() => {
    if (hasRoleMismatch) {
      window.location.reload();
    }
  }, [hasRoleMismatch]);

  useEffect(() => {
    if (!isAdmin && validOfferingId !== null && viewAsStudent) {
      dispatch(
        setViewAsStudentForOffering({
          offeringId: validOfferingId,
          value: false,
        }),
      );
    }
  }, [isAdmin, viewAsStudent, validOfferingId, dispatch]);

  useEffect(() => {
    if (validOfferingId !== null) {
      dispatch(
        setViewAsStudentForOffering({
          offeringId: validOfferingId,
          value: false,
        }),
      );
    }
  }, [offeringIdParam, dispatch, validOfferingId]);

  const courseName = useMemo(() => {
    if (offering?.course) {
      return `${offering.course.department} ${offering.course.number} - ${offering.course.name}`;
    }
    return `Course ${offeringIdParam ?? ''}`;
  }, [
    offering?.course?.department,
    offering?.course?.number,
    offering?.course?.name,
    offeringIdParam,
  ]);

  useEffect(() => {
    if (!offeringIdParam || validOfferingId === null) return;

    const currentPath = location.pathname;

    if (currentPath.includes('/dashboard')) {
      return;
    }

    const settingsMatch = matchPath(
      { path: '/courses/:offeringId/settings', end: true },
      currentPath,
    );

    const sparkMatch = matchPath(
      { path: '/courses/:offeringId/spark', end: true },
      currentPath,
    );

    const restrictedMatch = settingsMatch || sparkMatch;

    if (!restrictedMatch?.params.offeringId) return;
    if (restrictedMatch.params.offeringId !== offeringIdParam) return;

    if (loading || !effectiveRole) return;

    if (sparkMatch?.params.offeringId === offeringIdParam) {
      if (!canAccessSparkOfferingRoute(effectiveRole)) {
        navigate(`/courses/${offeringIdParam}`, { replace: true });
      }
      return;
    }

    if (settingsMatch?.params.offeringId === offeringIdParam) {
      if (!canAccessCourseSettingsRoute(effectiveRole)) {
        navigate(`/courses/${offeringIdParam}`, { replace: true });
      }
    }
  }, [
    offeringIdParam,
    validOfferingId,
    effectiveRole,
    navigate,
    loading,
    location.pathname,
  ]);

  if (!isAuthenticated) {
    return null;
  }

  if (hasRoleMismatch) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Verifying permissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {(offering || loading) && offeringIdParam && (
        <CourseNavBar
          offeringIdParam={offeringIdParam}
          courseName={courseName}
          courseUserRole={offering?.userRole}
          semester={offering?.semester}
        />
      )}

      <div className="flex flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
