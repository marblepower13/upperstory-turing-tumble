import { Board } from './board';
import { BoardBuilder } from './builder';
import { CHALLENGES, ChallengeDefinition } from './challenge-data';
import { PartType } from 'parts/factory';

// Challenge loading changes the machine setup, never its routing or physics.
export class Challenges {
  public static readonly definitions:ChallengeDefinition[] = CHALLENGES;

  public static find(id:number):ChallengeDefinition {
    return CHALLENGES.filter(item => item.id === id)[0] || null;
  }

  public static load(board:Board, id:number, blueCount?:number):boolean {
    const definition = Challenges.find(id);
    if (!definition) return false;
    board.cancelInteraction();
    BoardBuilder.initStandardBoard(board);
    board.bulkUpdate = true;
    for (const item of definition.layout) {
      const part = board.partFactory.make(item[2]);
      if (part.canFlip) part.isFlipped = item[3] === 0;
      else if (part.canRotate) part.rotation = 1 - item[3];
      part.isLocked = true;
      board.setPart(part, item[0], item[1]);
    }
    for (const drop of board.drops) {
      let count = definition.supplies[drop.isFlipped ? 1 : 0];
      if (!drop.isFlipped && definition.variableMax && blueCount !== undefined)
        count = Math.max(0, Math.min(definition.variableMax, Math.floor(blueCount)));
      board.setDropBallCount(drop, count);
    }
    board.bulkUpdate = false;
    Challenges.restoreSession(board, id);
    return true;
  }

  // Used by saved PNG boards and URL state after their grid has been restored.
  public static restoreSession(board:Board, id:number):boolean {
    const definition = Challenges.find(id);
    if (!definition || board.columnCount !== 13 || board.rowCount !== 17) return false;
    for (const item of definition.layout) {
      const part = board.getPart(item[0], item[1]);
      if (!part || part.type !== item[2]) return false;
    }
    board.clearChallenge();
    board.challengeId = id;
    board.challengeStart = definition.start;
    board.challengeLimits = definition.limits;
    board.allowBoardResize = false;
    for (const item of definition.layout) {
      const part = board.getPart(item[0], item[1]);
      part.isLocked = true;
      part.alpha = 0.65;
      board.challengeFixedParts.add(part);
    }
    board.challengeLabels = definition.labels.map(item => ({
      column: Number(item[0]) + 0.36, row: Number(item[1]) + 0.35,
      text: String(item[2])
    }));
    board.onChange();
    return true;
  }
}
