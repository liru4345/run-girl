// styles/globalStyles.js

import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#ff69b4',
  primaryDark: '#ff3385',
  white: '#ffffff',
  background: '#fff5fb',
  text: '#163e8a',
  muted: '#5e6a88',
  border: '#f7d6e2',
};

export const globalStyles = StyleSheet.create({
  /* SCREEN */

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  /* TEXT */

  textPrimary: {
    color: colors.primary,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  bodyText: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },

  /* NAVBAR / HEADER */

  navbar: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  navbarTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },

  navLink: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  /* BUTTONS */

  primaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonFilled: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },

  primaryButtonFilledText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },

  outlinePinkButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  outlinePinkButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* INPUTS */

  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 14,
  },

  inputFocused: {
    borderColor: colors.primary,
  },

  /* CARDS */

  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },

  cardBody: {
    padding: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },

  cardText: {
    color: colors.muted,
    lineHeight: 20,
  },

  /* IMAGES */

  image: {
    width: '100%',
    aspectRatio: 16 / 9,
  },

  /* HELPERS */

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  bgPink: {
    backgroundColor: colors.primary,
  },

  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
});