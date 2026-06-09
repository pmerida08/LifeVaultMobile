jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

// Mock manual de Reanimated: el mock oficial (react-native-reanimated/mock)
// arrastra react-native-worklets, cuya parte nativa no existe en jest.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createAnimatedComponent = (Component) => Component;
  const Animated = { View, createAnimatedComponent };
  const passthrough = (value) => value;
  const easingFn = () => 0;
  return {
    __esModule: true,
    default: Animated,
    createAnimatedComponent,
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (fn) => (typeof fn === 'function' ? fn() : {}),
    withTiming: passthrough,
    withSpring: passthrough,
    withDelay: (_delay, value) => value,
    withRepeat: passthrough,
    interpolate: () => 0,
    Easing: {
      out: () => easingFn,
      inOut: () => easingFn,
      in: () => easingFn,
      quad: easingFn,
      ease: easingFn,
      linear: easingFn,
    },
    Extrapolation: { CLAMP: 'clamp' },
  };
});

// @expo/vector-icons arrastra expo-font/expo-asset, que no se resuelven en jest.
// Cada icon set (Ionicons, AntDesign, …) se sustituye por un componente trivial.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const makeIcon = (setName) => {
    const Icon = ({ name, ...props }) =>
      React.createElement(Text, props, name ?? setName);
    Icon.displayName = setName;
    return Icon;
  };
  return new Proxy(
    {},
    { get: (_target, prop) => (prop === '__esModule' ? true : makeIcon(String(prop))) }
  );
});
