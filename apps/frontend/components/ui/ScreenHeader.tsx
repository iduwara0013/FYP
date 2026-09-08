import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = { title: string; subtitle?: string; onBack: () => void; icon?: keyof typeof MaterialCommunityIcons.glyphMap; action?: React.ReactNode };

export function ScreenHeader({ title, subtitle, onBack, icon, action }: Props) {
  const { theme } = useTheme(); const { colors, shadows } = theme;
  return <View style={[styles.wrap,{backgroundColor:colors.surface,borderBottomColor:colors.border},shadows.soft]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={[styles.back,{backgroundColor:colors.backgroundAlt}]}><MaterialCommunityIcons name="arrow-left" size={21} color={colors.text}/></TouchableOpacity>
    {icon?<View style={[styles.icon,{backgroundColor:colors.primarySoft}]}><MaterialCommunityIcons name={icon} size={22} color={colors.primary}/></View>:null}
    <View style={styles.copy}><Text numberOfLines={1} style={[styles.title,{color:colors.text}]}>{title}</Text>{subtitle?<Text numberOfLines={1} style={[styles.subtitle,{color:colors.textMuted}]}>{subtitle}</Text>:null}</View>{action}
  </View>;
}
const styles=StyleSheet.create({wrap:{minHeight:76,paddingHorizontal:16,paddingVertical:13,flexDirection:"row",alignItems:"center",gap:10,borderBottomWidth:1,zIndex:5},back:{width:44,height:44,borderRadius:15,alignItems:"center",justifyContent:"center"},icon:{width:44,height:44,borderRadius:15,alignItems:"center",justifyContent:"center"},copy:{flex:1},title:{fontSize:19,lineHeight:25,fontWeight:"900",letterSpacing:-0.2},subtitle:{fontSize:12,lineHeight:18,fontWeight:"500",marginTop:1}});
