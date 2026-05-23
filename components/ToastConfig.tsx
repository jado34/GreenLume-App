// Custom Toast Config — Branded toast notifications
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const ToastBase = ({
  text1,
  text2,
  icon,
  bgColor,
  iconColor,
}: {
  text1?: string;
  text2?: string;
  icon: string;
  bgColor: string;
  iconColor: string;
}) => (
  <View style={[styles.container, { backgroundColor: bgColor }]}>
    <View style={[styles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
      <Ionicons name={icon as any} size={20} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      {text1 && <Text style={styles.title}>{text1}</Text>}
      {text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  </View>
);

export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <ToastBase text1={text1} text2={text2} icon="checkmark-circle" bgColor="#f0fdf4" iconColor={Colors.success} />
  ),
  error: ({ text1, text2 }: any) => (
    <ToastBase text1={text1} text2={text2} icon="alert-circle" bgColor="#fef2f2" iconColor={Colors.error} />
  ),
  info: ({ text1, text2 }: any) => (
    <ToastBase text1={text1} text2={text2} icon="information-circle" bgColor="#eff6ff" iconColor={Colors.info} />
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.textPrimary, marginBottom: 2 },
  message: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
});
