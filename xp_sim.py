import itertools
import sys

class Character:
    def __init__(self, name, race, actions, xp, fatigue):
        self.name = name
        self.race = race
        self.actions = actions
        self.xp = xp
        self.fatigue = fatigue

    def can_act(self):
        return self.actions > 0 and self.fatigue < 6

    def train(self, target):
        if target.fatigue < 6 and self != target:
            self.actions -= 1
            self.fatigue += 1
            target.fatigue += 1
            if self.race == target.race:
                self.xp += 2
            else:
                self.xp += 2

    def attack(self, target):
        if (self.name == "Glenefal" and target.name == "Tiroloin") or (self.name == "Tiroloin" and target.name == "Glenefal"):
            self.actions -= 1
            self.fatigue += 1
            target.fatigue += 1
            self.xp += 5

    def rest(self):
        self.actions -= 1
        self.fatigue = max(0, self.fatigue - 4)

    def reset_turn(self):
        self.actions = 4 if self.name in ["Glenefal", "Katorz"] else 3
        self.fatigue = max(0, self.fatigue - 2)

# Initialize characters
glenefal = Character("Glenefal", "dwarf", 4, 2170, 0)
katorz = Character("Katorz", "dwarf", 4, 2265, 0)
cradek = Character("Cradek", "dwarf", 3, 2287, 0)
tiroloin = Character("Tiroloin", "giant", 3, 2095, 0)

characters = [glenefal, katorz, cradek, tiroloin]

def get_weakest():
    return min(characters, key=lambda c: c.xp)

def simulate_turn(actions_by_character):
    """Simulates a single turn where each character performs their chosen actions."""
    # Backup state for rollback
    backup = [(c.actions, c.xp, c.fatigue) for c in characters]

    for character, actions in actions_by_character.items():
        if actions:
            for action, target in actions:
                if action == "train" and target:
                    character.train(target)
                elif action == "attack" and target:
                    character.attack(target)
                elif action == "rest":
                    character.rest()

    # Calculate weakest character's XP after the turn
    weakest_xp = get_weakest().xp

    # Restore state for evaluation purposes
    for i, (actions, xp, fatigue) in enumerate(backup):
        characters[i].actions = actions
        characters[i].xp = xp
        characters[i].fatigue = fatigue

    return weakest_xp

def generate_action_combinations(character):
    possible_actions = []
    if character.can_act():
        for _ in range(character.actions):
            if character.name == "Glenefal":
                possible_actions.append(("attack", tiroloin))
            elif character.name == "Tiroloin":
                possible_actions.append(("attack", glenefal))

        for target in characters:
            if target != character and target.fatigue < 6:
                possible_actions.append(("train", target))

        possible_actions.append(("rest", None))

    return itertools.product(possible_actions, repeat=character.actions)

# Simulation
turns = 1  # Adjusted for a single turn
weakest = get_weakest()
print(f"Turn {turns}: Weakest character is {weakest.name} with {weakest.xp} XP.")

# Determine the best actions for all characters
best_combination = None
max_weakest_xp = weakest.xp

# Generate all possible action combinations for each character
character_combinations = {
    character: list(generate_action_combinations(character)) for character in characters if character.can_act()
}

print("Generated action combinations for each character:")
for character, combinations in character_combinations.items():
    print(f"  {character.name}: {len(combinations)} combinations")

# Total combinations to test
total_combinations = 1
for combinations in character_combinations.values():
    total_combinations *= len(combinations)

print(f"Total combinations to test: {total_combinations}")

# Iterate over all possible action combinations for all characters
for idx, actions_set in enumerate(itertools.product(*character_combinations.values()), 1):
    # Progress bar
    if idx % 100000 == 0 or idx == total_combinations:
        progress = (idx / total_combinations) * 100
        print(f"Progress: {progress:.2f}% ({idx}/{total_combinations})", file=sys.stderr)

    actions_by_character = {
        character: actions for character, actions in zip(character_combinations.keys(), actions_set)
    }

    # Simulate this set of actions
    weakest_xp_after = simulate_turn(actions_by_character)

    if weakest_xp_after > max_weakest_xp:
        max_weakest_xp = weakest_xp_after
        best_combination = actions_by_character

# Apply the best combination
if best_combination:
    print("Applying the best combination:")
    for character, actions in best_combination.items():
        for action, target in actions:
            if action == "train" and target:
                character.train(target)
            elif action == "attack" and target:
                character.attack(target)
            elif action == "rest":
                character.rest()
        print(f"{character.name} performed actions: {[a[0] for a in actions]}. XP: {character.xp}, Fatigue: {character.fatigue}.")

# Reset actions and fatigue for the next turn
for character in characters:
    character.reset_turn()

print(f"Simulation ended after {turns} turn.")
for character in characters:
    print(f"{character.name}: XP = {character.xp}, Fatigue = {character.fatigue}")
