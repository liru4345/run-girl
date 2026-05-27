import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { getCalendarEvents } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';


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

export default function CalendarScreen() {
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
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.navButton} onPress={() => setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
            <Text style={styles.navText}>◀</Text>
          </TouchableOpacity>
        <View>
          <Text style={styles.monthTitle}>{MONTHS[monthIndex]} {year}</Text>
          <Text style={styles.monthSubtitle}>Tap a day to view runs</Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={() => setAnchor(new Date(today.getFullYear(), today.getMonth(), 1))}>
          <Text style={styles.navText}>Today</Text>
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
              {items.length > 2 && <Text style={styles.moreText}>+{items.length - 2} more</Text>}
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
  container: { backgroundColor: '#fff5fb' },
  contentContainer: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  navButton: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#f7d6e2' },
  navText: { color: '#ff69b4', fontWeight: '700' },
  monthTitle: { fontSize: 26, fontWeight: '800', color: '#163e8a' },
  monthSubtitle: { color: '#5e6a88', marginTop: 4 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekdayText: { width: '14.28%', textAlign: 'center', color: '#7a2c5a', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', minHeight: 90, borderRadius: 16, borderWidth: 1, borderColor: '#f7d6e2', backgroundColor: '#fff', padding: 8, marginBottom: 8 },
  outsideDay: { backgroundColor: '#f8f9fa' },
  todayDay: { borderColor: '#ff69b4' },
  selectedDay: { backgroundColor: '#ffe6f0' },
  dayNumber: { fontWeight: '700', color: '#163e8a', marginBottom: 6 },
  eventPill: { fontSize: 10, color: '#ff69b4' },
  moreText: { fontSize: 10, color: '#5e6a88', marginTop: 4 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f7d6e2', marginBottom: 18 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#163e8a', marginBottom: 6 },
  summarySubtitle: { color: '#5e6a88' },
  eventsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eventsTitle: { fontSize: 18, fontWeight: '800', color: '#163e8a' },
  toggleLink: { color: '#ff69b4', fontWeight: '700' },
  eventCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#f7d6e2', marginBottom: 12 },
  eventLabel: { fontWeight: '700', color: '#163e8a', marginBottom: 8 },
  eventMeta: { color: '#5e6a88' },
  emptyText: { color: '#5e6a88', textAlign: 'center', marginTop: 16 }
});
