/**
 * DOM labels positioned over 3D nodes. The WebGL projector writes their
 * transforms each frame; React only decides which labels exist. Because the
 * labels are real buttons, every node on screen is keyboard- and
 * screen-reader-reachable.
 */
export const labelElements = new Map<string, HTMLElement>();

/** Latest screen position (CSS px) of every node, written by the constellation. */
export const screenPos = new Map<string, { x: number; y: number; visible: boolean }>();

/** Latest brightness (0…1) of each node, written by the constellation. */
export const nodeBrightness = new Map<string, number>();
