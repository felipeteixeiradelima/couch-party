import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { GameId, GameMetadata } from '@/types/game';

interface GameCardProps {
  game: GameMetadata;
  onPress: () => void;
}

function renderGameIcon(id: GameId, color: string) {
  switch (id) {
    case 'impostor':
      return (
        <MaterialCommunityIcons name="drama-masks" size={24} color={color} />
      );
    case 'cidade-dorme':
      return (
        <Ionicons name="moon-outline" size={22} color={color} />
      );
    case 'perguntas':
      return (
        <Ionicons name="help-circle-outline" size={24} color={color} />
      );
  }
}

export function GameCard({ game, onPress }: GameCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${game.title}, ${game.minPlayers} a ${game.maxPlayers} jogadores. ${game.description}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topRow}>
        <View
          style={[styles.iconBox, { backgroundColor: game.iconBgColor }]}
          accessible={false}
        >
          {renderGameIcon(game.id, game.accentColor)}
        </View>

        <View style={styles.badge}>
          <Ionicons
            name="people-outline"
            size={14}
            color={COLORS.textSecondary}
          />
          <Text style={styles.badgeText}>
            {game.minPlayers}–{game.maxPlayers} jogadores
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{game.title}</Text>

      <View style={styles.bottomRow}>
        <Text style={styles.description}>{game.description}</Text>

        <View style={styles.chevronBox} accessible={false}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textSecondary}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
  },
  cardPressed: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  badgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  description: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  chevronBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
