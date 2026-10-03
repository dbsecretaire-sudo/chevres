import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/shared/styles/components/Screen.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  return (
    <SafeAreaView style={commonStyles.screenBg} edges={['bottom']}>
      {scroll ? (
        <ScrollView style={commonStyles.screenBg} contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      ) : (
        <View style={[commonStyles.screenBg, styles.content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
