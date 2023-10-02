import {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
  type RefObject
} from 'react';
import noop from 'lodash/noop';
import uniqueId from 'lodash/uniqueId';
import {
  SpatialNavigation,
  type FocusableComponentLayout,
  type FocusDetails,
  type KeyPressDetails,
  type Direction
} from './SpatialNavigation';
import { useFocusContext } from './useFocusContext';

export type EnterPressHandler<P = object> = (
  props: P,
  details: KeyPressDetails
) => void;

export type EnterHoldHandler<P = object> = (
  props: P,
  details: KeyPressDetails
) => boolean;

export type EnterReleaseHandler<P = object> = (props: P) => void;

export type ArrowPressHandler<P = object> = (
  direction: string,
  props: P,
  details: KeyPressDetails
) => boolean;

export type FocusHandler<P = object> = (
  layout: FocusableComponentLayout,
  props: P,
  details: FocusDetails
) => void;

export type BlurHandler<P = object> = (
  layout: FocusableComponentLayout,
  props: P,
  details: FocusDetails
) => void;

export interface UseFocusableConfig<P = object> {
  focusable?: boolean;
  saveLastFocusedChild?: boolean;
  trackChildren?: boolean;
  autoRestoreFocus?: boolean;
  forceFocus?: boolean;
  isFocusBoundary?: boolean;
  focusBoundaryDirections?: Direction[];
  focusKey?: string;
  preferredChildFocusKey?: string;
  onEnterPress?: EnterPressHandler<P>;
  onEnterHold?: EnterHoldHandler<P>;
  onEnterRelease?: EnterReleaseHandler<P>;
  onArrowPress?: ArrowPressHandler<P>;
  onFocus?: FocusHandler<P>;
  onBlur?: BlurHandler<P>;
  extraProps?: P;
}

export interface UseFocusableResult {
  ref: RefObject<any>; // <any> since we don't know which HTML tag is passed here
  focusSelf: (focusDetails?: FocusDetails) => void;
  focused: boolean;
  hasFocusedChild: boolean;
  focusKey: string;
}

const useFocusableHook = <P>({
  focusable = true,
  saveLastFocusedChild = true,
  trackChildren = false,
  autoRestoreFocus = true,
  forceFocus = false,
  isFocusBoundary = false,
  focusBoundaryDirections,
  focusKey: propFocusKey,
  preferredChildFocusKey,
  onEnterPress = noop,
  onEnterHold = () => true,
  onEnterRelease = noop,
  onArrowPress = () => true,
  onFocus = noop,
  onBlur = noop,
  extraProps
}: UseFocusableConfig<P> = {}): UseFocusableResult => {
  const onEnterPressHandler = useCallback(
    (details: KeyPressDetails) => {
      onEnterPress(extraProps, details);
    },
    [onEnterPress, extraProps]
  );

  const onEnterHoldHandler = useCallback(
    (details: KeyPressDetails) => onEnterHold(extraProps, details),
    [onEnterHold, extraProps]
  );

  const onEnterReleaseHandler = useCallback(() => {
    onEnterRelease(extraProps);
  }, [onEnterRelease, extraProps]);

  const onArrowPressHandler = useCallback(
    (direction: string, details: KeyPressDetails) =>
      onArrowPress(direction, extraProps, details),
    [extraProps, onArrowPress]
  );

  const onFocusHandler = useCallback(
    (layout: FocusableComponentLayout, details: FocusDetails) => {
      onFocus(layout, extraProps, details);
    },
    [extraProps, onFocus]
  );

  const onBlurHandler = useCallback(
    (layout: FocusableComponentLayout, details: FocusDetails) => {
      onBlur(layout, extraProps, details);
    },
    [extraProps, onBlur]
  );

  const ref = useRef(null);

  const [focused, setFocused] = useState(false);
  const [hasFocusedChild, setHasFocusedChild] = useState(false);

  const parentFocusKey = useFocusContext();

  /**
   * Either using the propFocusKey passed in, or generating a random one
   */
  const focusKey = useMemo(
    () => propFocusKey || uniqueId('sn:focusable-item-'),
    [propFocusKey]
  );

  const focusSelf = useCallback(
    async (focusDetails: FocusDetails = {}) => {
      await SpatialNavigation.setFocus(focusKey, focusDetails);
    },
    [focusKey]
  );

  const promiseRef = useRef(Promise.resolve());

  useEffect(() => {
    const node = ref.current;

    promiseRef.current = promiseRef.current.then(() =>
      SpatialNavigation.addFocusable({
        focusKey,
        node,
        parentFocusKey,
        preferredChildFocusKey,
        onEnterPress: onEnterPressHandler,
        onEnterHold: onEnterHoldHandler,
        onEnterRelease: onEnterReleaseHandler,
        onArrowPress: onArrowPressHandler,
        onFocus: onFocusHandler,
        onBlur: onBlurHandler,
        onUpdateFocus: (isFocused = false) => setFocused(isFocused),
        onUpdateHasFocusedChild: (isFocused = false) =>
          setHasFocusedChild(isFocused),
        saveLastFocusedChild,
        trackChildren,
        isFocusBoundary,
        focusBoundaryDirections,
        autoRestoreFocus,
        forceFocus,
        focusable
      })
    );

    return () => {
      promiseRef.current = promiseRef.current.then(() =>
        SpatialNavigation.removeFocusable({
          focusKey
        })
      );
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const node = ref.current;

    SpatialNavigation.updateFocusable(focusKey, {
      node,
      preferredChildFocusKey,
      focusable,
      isFocusBoundary,
      focusBoundaryDirections,
      onEnterPress: onEnterPressHandler,
      onEnterHold: onEnterHoldHandler,
      onEnterRelease: onEnterReleaseHandler,
      onArrowPress: onArrowPressHandler,
      onFocus: onFocusHandler,
      onBlur: onBlurHandler
    });
  }, [
    focusKey,
    preferredChildFocusKey,
    focusable,
    isFocusBoundary,
    focusBoundaryDirections,
    onEnterPressHandler,
    onEnterHoldHandler,
    onEnterReleaseHandler,
    onArrowPressHandler,
    onFocusHandler,
    onBlurHandler
  ]);

  return {
    ref,
    focusSelf,
    focused,
    hasFocusedChild,
    focusKey // returns either the same focusKey as passed in, or generated one
  };
};

export const useFocusable = useFocusableHook;
