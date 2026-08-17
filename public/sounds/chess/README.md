# Chess sounds: drop yours in here

These ten files are silent placeholders. Replace any of them with a real
MP3 of the same name and the chess game plays your recording instead of
its synthesised effect. No code changes, no rebuild in production; the
game checks each file's size at load and treats anything that is not the
4,160-byte placeholder as real.

| File | Played when |
| --- | --- |
| `game-start.mp3` | a new game begins |
| `move-self.mp3` | you move |
| `move-opponent.mp3` | the computer moves |
| `capture.mp3` | a piece is taken |
| `castle.mp3` | either side castles |
| `move-check.mp3` | a move gives check |
| `promote.mp3` | a pawn promotes |
| `illegal.mp3` | an illegal move is attempted |
| `game-end.mp3` | checkmate, stalemate or a draw |
| `premove.mp3` | reserved: the game has no premoves yet, but the slot is here |

One sound plays per move, the most specific that applies: game end beats
check beats promotion beats castling beats capture beats a plain move.
