import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GAMES_BY_ID } from '@/constants/games';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { usePlayers } from '@/hooks/usePlayers';
import { GameId } from '@/types/game';

interface GameLobbyTemplateProps {
  gameId: GameId;
}

export function GameLobbyTemplate({ gameId }: GameLobbyTemplateProps) {
  const { players } = usePlayers();
  const game = GAMES_BY_ID[gameId];

  const hasEnoughPlayers = players.length >= game.minPlayers;
  const hasTooManyPlayers = players.length > game.maxPlayers;
  const isReady = hasEnoughPlayers && !hasTooManyPlayers;

  const missingCount = Math.max(0, game.minPlayers - players.length);
  const excessCount = Math.max(0, players.length - game.maxPlayers);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title={game.title}
        subtitle={`${game.minPlayers}–${game.maxPlayers} jogadores`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.statusCard,
            isReady ? styles.statusReady : styles.statusWarning,
          ]}
        >
          <Ionicons
            name={
              isReady
                ? 'checkmark-circle-outline'
                : 'alert-circle-outline'
            }
            size={22}
            color={isReady ? COLORS.success : COLORS.warning}
          />
          <View style={styles.statusTextBlock}>
            <Text style={styles.statusTitle}>
              {isReady
                ? `${players.length} jogadores prontos`
                : hasTooManyPlayers
                  ? `Remova ${excessCount} jogador${excessCount > 1 ? 'es' : ''}`
                  : `Adicione mais ${missingCount} jogador${missingCount > 1 ? 'es' : ''}`}
            </Text>
            <Text style={styles.statusDescription}>
              {isReady
                ? 'A quantidade de jogadores está dentro do ideal para começar.'
                : `${game.title} aceita de ${game.minPlayers} a ${game.maxPlayers} jogadores.`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jogadores na partida</Text>
            <Text style={styles.sectionCount}>{players.length}</Text>
          </View>

          {players.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Nenhum jogador configurado ainda.
              </Text>
            </View>
          ) : (
            <View style={styles.playersGrid}>
              {players.map((player) => (
                <View key={player.id} style={styles.playerChip}>
                  <PlayerAvatar
                    name={player.name}
                    color={player.color}
                    size={28}
                  />
                  <Text style={styles.playerChipName} numberOfLines={1}>
                    {player.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como jogar</Text>
          <View style={styles.rulesCard}>
            {game.rulesSummary.map((rule, index) => (
              <View key={rule} style={styles.ruleRow}>
                <Text style={[styles.ruleIndex, { color: game.accentColor }]}>
                  {index + 1}.
                </Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!isReady ? (
          <Button
            label="Configurar Jogadores"
            onPress={() => router.push('/players')}
            icon={
              <Ionicons
                name="people-outline"
                size={20}
                color={COLORS.white}
              />
            }
          />
        ) : (
          <View style={styles.footerActions}>
            <Button
              label="Ajustar Jogadores"
              variant="secondary"
              onPress={() => router.push('/players')}
            />
            <Button
              label="Fluxo da partida em desenvolvimento"
              disabled
              onPress={() => {}}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  statusReady: {
    backgroundColor: COLORS.successSoft,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusWarning: {
    backgroundColor: COLORS.warningSoft,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusTextBlock: {
    flex: 1,
  },
  statusTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    maxWidth: '48%',
  },
  playerChipName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  rulesCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ruleIndex: {
    fontSize: 14,
    fontWeight: '700',
    width: 18,
  },
  ruleText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  footerActions: {
    gap: SPACING.sm,
  },
});
