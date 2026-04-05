export const MIN_TOUCH_SIZE = 44;

export const AccessibilityRoles = {
  BUTTON: 'button' as const,
  HEADER: 'header' as const,
  LINK: 'link' as const,
  SEARCH: 'search' as const,
  IMAGE: 'image' as const,
  TEXT: 'text' as const,
  ADJUSTABLE: 'adjustable' as const,
  SWITCH: 'switch' as const,
  TAB: 'tab' as const,
  TAB_LIST: 'tablist' as const,
  SUMMARY: 'summary' as const,
  NONE: 'none' as const,
};

export const AccessibilityStates = {
  SELECTED: { selected: true } as const,
  DISABLED: { disabled: true } as const,
  EXPANDED: { expanded: true } as const,
  COLLAPSED: { expanded: false } as const,
};
