import { afterEach, describe, expect, it } from 'vitest';
import { definirModeSimple } from '@/shared/hooks/useModeSimple';
import { lireAEnvoyer, noterAEnvoyer, remettreAEnvoyer, surAEnvoyer } from '@/shared/storage/aEnvoyer';

describe('les saisies du mode normal à envoyer sur Drive', () => {
  afterEach(async () => {
    definirModeSimple(true);
    await remettreAEnvoyer();
    definirModeSimple(false);
  });

  it('chaque saisie du mode normal s’ajoute, une annulation en retire une, un envoi remet à zéro', async () => {
    definirModeSimple(true);
    await remettreAEnvoyer();
    await noterAEnvoyer();
    await noterAEnvoyer(3);
    expect(await lireAEnvoyer()).toBe(4);
    await noterAEnvoyer(-3);
    expect(await lireAEnvoyer()).toBe(1);
    await remettreAEnvoyer();
    expect(await lireAEnvoyer()).toBe(0);
  });

  it('le compte ne descend jamais sous zéro', async () => {
    definirModeSimple(true);
    await remettreAEnvoyer();
    await noterAEnvoyer(-2);
    expect(await lireAEnvoyer()).toBe(0);
  });

  it('les saisies du mode avancé ne comptent pas', async () => {
    definirModeSimple(true);
    await remettreAEnvoyer();
    definirModeSimple(false);
    await noterAEnvoyer(2);
    expect(await lireAEnvoyer()).toBe(0);
  });

  it('prévient ceux qui suivent le compte', async () => {
    definirModeSimple(true);
    await remettreAEnvoyer();
    const vus: number[] = [];
    const arreter = surAEnvoyer((n) => vus.push(n));
    await noterAEnvoyer(2);
    await remettreAEnvoyer();
    arreter();
    expect(vus).toEqual([2, 0]);
  });
});
