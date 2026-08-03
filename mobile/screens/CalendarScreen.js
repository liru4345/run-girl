import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCalendarEvents } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

const MONTHS = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthMatrix(anchor) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CalendarScreen({ navigation }) {
  const [anchor, setAnchor] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEvents, setShowEvents] = useState(true);

  const year = anchor.getFullYear();
  const monthIndex = anchor.getMonth();
  const today = new Date();
  const grid = useMemo(() => getMonthMatrix(anchor), [anchor]);

  useEffect(() => {
    const from = fmt(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    const to = fmt(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
    getCalendarEvents(from, to)
      .then(setEvents)
      .catch((err) => {
        console.error('Calendar load failed:', err);
        setEvents([]);
      });
  }, [anchor]);

  const runsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = (event.start_time || '').slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const selectedDateKey = fmt(selected);
  const dayEvents = runsByDay.get(selectedDateKey) || [];

  return (
    <ScreenWrapper>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color={colors.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Calendar</Text>
      <View style={{ width: 28 }} />
    </View>
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.monthControls}>
          <TouchableOpacity onPress={() => setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
            <Ionicons name="chevron-back" size={24} color={colors.pink500} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.monthTitle}>{MONTHS[monthIndex]} {year}</Text>
            <Text style={styles.monthSubtitle}>Tap a day to view runs</Text>
          </View>
          <TouchableOpacity onPress={() => setAnchor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            <Text style={styles.todayButton}>Today</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((weekday) => (
            <Text key={weekday} style={styles.weekdayText}>{weekday}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map((day) => {
            const inMonth = day.getMonth() === monthIndex;
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selected);
            const dayKey = fmt(day);
            const items = runsByDay.get(dayKey) || [];
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayCell,
                  !inMonth && styles.outsideDay,
                  isToday && styles.todayDay,
                  isSelected && styles.selectedDay,
                ]}
                onPress={() => {
                  setSelected(day);
                  setShowEvents(true);
                }}
              >
                <Text style={styles.dayNumber}>{day.getDate()}</Text>
                {items.slice(0, 2).map((event) => (
                  <Text key={event.id} style={styles.eventPill}>• {event.expected_miles ?? 'Run'}</Text>
                ))}
                {items.length > 2 && <Text style={styles.moreText}>+{items.length - 2}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Selected: {MONTHS[selected.getMonth()]} {selected.getDate()}, {selected.getFullYear()}</Text>
          <Text style={styles.summarySubtitle}>{dayEvents.length === 0 ? 'No runs scheduled on this day.' : `${dayEvents.length} run(s)`}</Text>
        </View>

        <View style={styles.eventsHeaderRow}>
          <Text style={styles.eventsTitle}>Runs on this day</Text>
          <TouchableOpacity onPress={() => setShowEvents((prev) => !prev)}>
            <Text style={styles.toggleLink}>{showEvents ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {showEvents && (
          <FlatList
            data={dayEvents}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <Text style={styles.eventLabel}>{item.location || 'Run location'}</Text>
                <Text style={styles.eventMeta}>Start: {new Date(item.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                <Text style={styles.eventMeta}>Mileage: {item.expected_miles ?? 'TBD'}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No calendar events for this date.</Text>}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  container: { backgroundColor: colors.white },
  contentContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing['3xl'] },
  monthControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  monthTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  monthSubtitle: { color: colors.gray600, marginTop: 2, fontSize: typography.xs },
  todayButton: { color: colors.pink500, fontWeight: '700', fontSize: typography.sm },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  weekdayText: { width: '14.28%', textAlign: 'center', color: colors.pink500, fontWeight: '700', fontSize: typography.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  dayCell: {
    width: '14.28%', minHeight: 80, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white, padding: spacing.xs, marginBottom: spacing.sm
  },
  outsideDay: { backgroundColor: colors.gray50 },
  todayDay: { borderColor: colors.pink500, borderWidth: 2 },
  selectedDay: { backgroundColor: colors.pink100 },
  dayNumber: { fontWeight: '700', color: colors.ink, marginBottom: 2, fontSize: typography.xs },
  eventPill: { fontSize: 9, color: colors.pink500, lineHeight: 12 },
  moreText: { fontSize: 8, color: colors.gray600, marginTop: 2 },
  summaryCard: {
    backgroundColor: colors.white, borderRadius: 12, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg
  },
  summaryTitle: { fontSize: typography.sm, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
  summarySubtitle: { color: colors.gray600, fontSize: typography.xs },
  eventsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  eventsTitle: { fontSize: typography.md, fontWeight: '700', color: colors.ink },
  toggleLink: { color: colors.pink500, fontWeight: '700', fontSize: typography.xs },
  eventCard: {
    backgroundColor: colors.white, borderRadius: 10, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm
  },
  eventLabel: { fontWeight: '700', color: colors.ink, marginBottom: spacing.xs, fontSize: typography.sm },
  eventMeta: { color: colors.gray600, fontSize: typography.xs, marginBottom: 2 },
  emptyText: { color: colors.gray600, textAlign: 'center', marginTop: spacing.lg },
});
