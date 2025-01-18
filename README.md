# TODO
* Now we need to remember the word trails and red/grey numbers

* Stop using a Set, but instead have an object that is [word,path] and, somehow, choose randomly between the different paths to the same word to select only one. Then use that as the basis for red and grey numbers. 
* For each path, the first element is a red number increment and subsequent are grey
* Return the paths and words to the web page to manage (?)
* Store red/grey number stuff in saved results


If there are 3 identical words from different paths, keep one at random


# Puzzle
| Field | Type | Description |
| ----- | ---- | ----------- |
| ```id``` | INTEGER | Primary key, unique |
| ```name``` | TEXT | Human readable puzzle name |
| ```date``` | INTEGER | Created date as UTC, milliseconds since epoch  |
| ```author``` | INTEGER | ID for user |
| ```difficulty``` | INTEGER| ID for difficulty star rating (0-5) |
| ```category``` | INTEGER| ID for Express, Daily, ... |
| ```letters``` | TEXT | Grid of letters as a single text line, spaces for empty sqaures (e.g. waffle)
| ```words``` | STRING ARRAY | Findable, point-scoring words |
| ```bonusWords``` | STRING ARRAY | Excluded words |
| ```excludedWords``` | STRING ARRAY | Excluded words |

Missing:
 * Red/grey number information
 * Grid finder will have come up with all words, but no categorisation
 * Ideally, excluded and bonus should be globally declared
 * Ideally, excluded and bonus should be only send to front end the applicable words

Conclusions:
 * Store puzzle in json/database where
   * New puzzles continue to identifying bonus and excluded word info
   * New puzzles to contain word paths for findable words
   * Utilities to contain and build their own bonus and excluded words lists
   * Creating a puzzle with utilities will assist with word classification
   * HTML is responsible for red/grey numbers
     * Can query path string for each undiscovered word and for each cell item using:
       *  ```words.forEach(word => if word.path.startsWith(cell.coords), cell.red++ else if word.path.contains(cell.coords), cell.grey++)```
   * Adding a puzzle 