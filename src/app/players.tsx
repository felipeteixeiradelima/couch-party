import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import {
  MAX_PLAYER_NAME_LENGTH,
  MAX_PLAYERS,
} from '@/contexts/PlayersContext';
import { usePlayers } from '@/hooks/usePlayers';
import { Player } from '@/types/player';

export default function PlayersScreen() {
  const {
    players,
    addPlayer,
    removePlayer,
    updatePlayerName,
    clearPlayers,
  } = usePlayers();

  const [nameInput, setNameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddPlayer = () => {
    const result = addPlayer(nameInput);
    if (!result.ok) {
      setErrorMessage(result.error ?? 'Não foi possível adicionar o jogador.');
      return;
    }

    setNameInput('');
    setErrorMessage(null);
  };

  const handleStartEdit = (player: Player) => {
    setEditingId(player.id);
    setEditingName(player.name);
    setErrorMessage(null);
  };

  const handleConfirmEdit = () => {
    if (!editingId) return;

    const result = updatePlayerName(editingId, editingName);
    if (!result.ok) {
      setErrorMessage(result.error ?? 'Não foi possível atualizar o nome.');
      return;
    }

    setEditingId(null);
    setEditingName('');
    setErrorMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Limpar jogadores',
      'Deseja remover todos os jogadores da lista?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover todos',
          style: 'destructive',
          onPress: () => {
            clearPlayers();
            setEditingId(null);
            setErrorMessage(null);
          },
        },
      ]
    );
  };

  const renderPlayerItem = ({ item, index }: { item: Player; index: number }) => {
    const isEditing = editingId === item.id;

    return (
      <View style={styles.playerRow}>
        <PlayerAvatar name={item.name} color={item.color} size={40} />

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              value={editingName}
              onChangeText={(text) => {
                setEditingName(text);
                if (errorMessage) setErrorMessage(null);
              }}
              maxLength={MAX_PLAYER_NAME_LENGTH}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmEdit}
              placeholder="Nome do jogador"
              placeholderTextColor={COLORS.textMuted}
              style={styles.editInput}
              accessibilityLabel={`Editar nome de ${item.name}`}
            />
            <Pressable
              onPress={handleConfirmEdit}
              accessibilityRole="button"
              accessibilityLabel="Salvar nome"
              style={({ pressed }) => [
                styles.iconButton,
                styles.confirmIconButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="checkmark" size={18} color={COLORS.success} />
            </Pressable>
            <Pressable
              onPress={handleCancelEdit}
              accessibilityRole="button"
              accessibilityLabel="Cancelar edição"
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.playerOrder}>Jogador {index + 1}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => handleStartEdit(item)}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${item.name}`}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="pencil-outline"
                  size={18}
                  color={COLORS.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={() => removePlayer(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remover ${item.name}`}
                style={({ pressed }) => [
                  styles.iconButton,
                  styles.deleteIconButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={COLORS.danger}
                />
              </Pressable>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader
          title="Jogadores"
          subtitle={`${players.length} de ${MAX_PLAYERS} adicionados`}
          rightSlot={
            players.length > 0 ? (
              <Pressable
                onPress={handleClearAll}
                accessibilityRole="button"
                accessibilityLabel="Limpar todos os jogadores"
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.clearButtonText}>Limpar</Text>
              </Pressable>
            ) : null
          }
        />

        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <TextInput
              value={nameInput}
              onChangeText={(text) => {
                setNameInput(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Nome do jogador"
              placeholderTextColor={COLORS.textMuted}
              maxLength={MAX_PLAYER_NAME_LENGTH}
              returnKeyType="done"
              onSubmitEditing={handleAddPlayer}
              style={styles.input}
              accessibilityLabel="Nome do novo jogador"
            />

            <Pressable
              onPress={handleAddPlayer}
              accessibilityRole="button"
              accessibilityLabel="Adicionar jogador"
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner} accessibilityLiveRegion="polite">
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={COLORS.danger}
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayerItem}
          contentContainerStyle={[
            styles.listContent,
            players.length === 0 && styles.emptyListContent,
          ]}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons
                  name="people-outline"
                  size={32}
                  color={COLORS.primaryText}
                />
              </View>
              <Text style={styles.emptyTitle}>Nenhum jogador na mesa</Text>
              <Text style={styles.emptyDescription}>
                Adicione pelo menos 3 jogadores para Impostor ou Perguntas, e 6
                ou mais para Cidade Dorme.
              </Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <Button label="Voltar aos jogos" onPress={() => router.back()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  clearButton: {
    minHeight: 36,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerSoft,
  },
  clearButtonText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  inputSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: SPACING.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  playerOrder: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  editInput: {
    flex: 1,
    minHeight: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIconButton: {
    backgroundColor: COLORS.successSoft,
  },
  deleteIconButton: {
    backgroundColor: COLORS.dangerSoft,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
});
