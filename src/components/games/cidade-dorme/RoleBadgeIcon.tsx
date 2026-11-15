import { CidadeDormeRole } from "@/types/cidadeDorme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

interface RoleBadgeIconProps {
  role: CidadeDormeRole;
  size?: number;
  color: string;
}

export function RoleBadgeIcon({ role, size = 36, color }: RoleBadgeIconProps) {
  switch (role) {
    case "assassin":
      return <MaterialCommunityIcons name="knife" size={size} color={color} />;
    case "detective":
      return <Ionicons name="search-outline" size={size} color={color} />;
    case "guardian_angel":
      return (
        <Ionicons name="shield-checkmark-outline" size={size} color={color} />
      );
    case "citizen":
      return <Ionicons name="person-outline" size={size} color={color} />;
  }
}
