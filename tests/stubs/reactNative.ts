/** Le strict nécessaire de react-native pour la logique testée sans interface (pas d'écran dans ces tests). */
export const Platform = { OS: 'node', select: <T,>(choix: { default?: T; node?: T }) => choix.node ?? choix.default };
export const StyleSheet = { create: <T,>(styles: T): T => styles, flatten: <T,>(style: T): T => style };
export const Alert = { alert: () => undefined };
export const Linking = { openURL: async () => undefined };
export const Dimensions = { get: () => ({ width: 800, height: 600 }) };
export default { Platform, StyleSheet, Alert, Linking, Dimensions };
