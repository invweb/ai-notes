import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types';

const NOTES_KEY = '@notes';

const demoNotes: Note[] = [
  {
    id: '1',
    rawText: 'Need to buy groceries: milk, bread, eggs, cheese. Also need to call mom about Sunday dinner plans.',
    structured: {
      title: 'Groceries & Family',
      summary: 'Shopping list and family dinner coordination',
      tasks: [
        { id: 't1', text: 'Buy groceries (milk, bread, eggs, cheese)', done: false, priority: 'high' },
        { id: 't2', text: 'Call mom about Sunday dinner', done: false, priority: 'medium' },
      ],
      keyPoints: ['Weekly grocery shopping needed', 'Family dinner on Sunday'],
      questions: [],
      format: 'tasks',
    },
    tags: ['shopping', 'family', 'errands'],
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
    userId: 'demo',
    synced: false,
  },
  {
    id: '2',
    rawText: 'Prepare presentation for Monday meeting. Include Q3 financial results, customer feedback summary, and roadmap for Q4. Need to coordinate with design team for slides.',
    structured: {
      title: 'Monday Presentation Prep',
      summary: 'Q3 review and Q4 planning presentation preparation',
      tasks: [
        { id: 't1', text: 'Prepare Q3 financial results section', done: false, priority: 'high' },
        { id: 't2', text: 'Summarize customer feedback', done: false, priority: 'high' },
        { id: 't3', text: 'Draft Q4 roadmap', done: false, priority: 'medium' },
        { id: 't4', text: 'Coordinate with design team', done: false, priority: 'medium' },
      ],
      keyPoints: ['Meeting is Monday', 'Need slides from design team'],
      questions: ['What metrics should I highlight?'],
      format: 'tasks',
    },
    tags: ['work', 'presentation', 'meeting'],
    createdAt: new Date('2024-01-14T14:30:00'),
    updatedAt: new Date('2024-01-14T14:30:00'),
    userId: 'demo',
    synced: false,
  },
  {
    id: '3',
    rawText: 'Ideas for new mobile app feature: push notifications for reminders, dark mode support, offline mode, voice commands. Should we prioritize based on user feedback?',
    structured: {
      title: 'Mobile App Feature Ideas',
      summary: 'Brainstorming session for new app features',
      tasks: [],
      keyPoints: [
        'Push notifications for reminders',
        'Dark mode support',
        'Offline mode capability',
        'Voice commands integration',
      ],
      questions: ['Should we prioritize based on user feedback?'],
      format: 'summary',
    },
    tags: ['ideas', 'product', 'mobile'],
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T09:15:00'),
    userId: 'demo',
    synced: false,
  },
  {
    id: '4',
    rawText: 'Workout plan for this week: Monday - chest and triceps, Wednesday - back and biceps, Friday - legs and shoulders. Saturday morning run 5K. Remember to stretch after each session.',
    structured: {
      title: 'Weekly Workout Plan',
      summary: 'Strength training split with weekend cardio',
      tasks: [
        { id: 't1', text: 'Monday: Chest & triceps workout', done: false, priority: 'medium' },
        { id: 't2', text: 'Wednesday: Back & biceps workout', done: false, priority: 'medium' },
        { id: 't3', text: 'Friday: Legs & shoulders workout', done: false, priority: 'medium' },
        { id: 't4', text: 'Saturday: 5K morning run', done: false, priority: 'low' },
      ],
      keyPoints: ['Stretch after each session', 'Consistent schedule throughout week'],
      questions: [],
      format: 'checklist',
    },
    tags: ['health', 'fitness', 'schedule'],
    createdAt: new Date('2024-01-12T20:00:00'),
    updatedAt: new Date('2024-01-12T20:00:00'),
    userId: 'demo',
    synced: false,
  },
  {
    id: '5',
    rawText: 'Research new project management tools. Current options: Jira, Asana, Monday.com, Notion. Need to compare pricing, features, and team size limits. Decision by end of month.',
    structured: {
      title: 'PM Tool Research',
      summary: 'Evaluating project management software options',
      tasks: [
        { id: 't1', text: 'Research Jira features and pricing', done: false, priority: 'medium' },
        { id: 't2', text: 'Research Asana features and pricing', done: false, priority: 'medium' },
        { id: 't3', text: 'Research Monday.com features and pricing', done: false, priority: 'medium' },
        { id: 't4', text: 'Research Notion features and pricing', done: false, priority: 'medium' },
        { id: 't5', text: 'Compare and make decision', done: false, priority: 'high' },
      ],
      keyPoints: ['Decision deadline: end of month', 'Compare pricing and team limits'],
      questions: ['What features are most important for our team?'],
      format: 'tasks',
    },
    tags: ['work', 'research', 'tools'],
    createdAt: new Date('2024-01-11T11:45:00'),
    updatedAt: new Date('2024-01-11T11:45:00'),
    userId: 'demo',
    synced: false,
  },
];

export async function populateDemoData(): Promise<void> {
  const existing = await AsyncStorage.getItem(NOTES_KEY);
  if (existing) {
    const notes = JSON.parse(existing);
    if (notes.length > 0) {
      return;
    }
  }

  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(demoNotes));
  console.log('Demo data populated successfully');
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(NOTES_KEY);
  console.log('All data cleared');
}
