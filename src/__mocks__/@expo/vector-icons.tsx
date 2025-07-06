import React from 'react';
import { Text } from 'react-native';

// Mock for @expo/vector-icons
export const Ionicons = ({ name, size, color, ...props }: any) => (
  <Text {...props} style={{ fontSize: size, color }}>
    {name}
  </Text>
);

export const MaterialIcons = ({ name, size, color, ...props }: any) => (
  <Text {...props} style={{ fontSize: size, color }}>
    {name}
  </Text>
);

export const FontAwesome = ({ name, size, color, ...props }: any) => (
  <Text {...props} style={{ fontSize: size, color }}>
    {name}
  </Text>
);

export const AntDesign = ({ name, size, color, ...props }: any) => (
  <Text {...props} style={{ fontSize: size, color }}>
    {name}
  </Text>
);

export const Feather = ({ name, size, color, ...props }: any) => (
  <Text {...props} style={{ fontSize: size, color }}>
    {name}
  </Text>
);