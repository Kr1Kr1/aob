import itertools

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
            self.xp += 2  # Both gain XP
            target.xp += 2

    def rest(self):
        if self.fatigue > 0:  # Only rest if there is fatigue to reduce
            self.actions -= 1
            self.xp += 1  # Gain 1 XP for resting
            self.fatigue = max(0, self.fatigue - 4)

    def reset_turn(self):
        self.actions = 4 if self.name in ["Glenefal", "Katorz"] else 3
        self.fatigue = max(0, self.fatigue - 2)


# Initialize characters
glenefal = Character("Glenefal", "dwarf", 4, 2170, 2)
katorz = Character("Katorz", "dwarf", 4, 2265, 2)
cradek = Character("Cradek", "dwarf", 3, 2287, 2)
tiroloin = Character("Tiroloin", "giant", 3, 2095, 2)

characters = [glenefal, katorz, cradek, tiroloin]


def get_two_weakest():
    return sorted(characters, key=lambda c: c.xp)[:2]


def generate_action_combinations(character, targets):
    """Generates combinations of actions for a character."""
    if not character.can_act():
        return []

    possible_actions = ["rest"]
    possible_actions.extend([f"train {target.name}" for target in targets if target != character and target.fatigue < 6])
    return list(itertools.product(possible_actions, repeat=character.actions))


def resolve_combination(combination):
    """Resolve a single combination of actions and return the result."""
    # Backup state for rollback
    backup = [(c.actions, c.xp, c.fatigue) for c in characters]

    # Resolve actions sequentially
    for character, action in combination:
        if not character.can_act():
            return -1, None  # Invalid sequence due to insufficient actions or high fatigue

        action_type, target_name = action.split()[0], action.split()[-1]
        target = next((c for c in characters if c.name == target_name), None) if action_type == "train" else None

        if action_type == "train" and target and target.fatigue < 6:
            character.train(target)
        elif action_type == "rest":
            character.rest()
        else:
            return -1, None  # Invalid action

    # Calculate XP gain for the weakest two characters
    weakest_two_xp = sum(c.xp for c in get_two_weakest())
    result = (weakest_two_xp, [(c.name, c.xp, c.fatigue) for c in characters])

    # Restore state
    for i, (actions, xp, fatigue) in enumerate(backup):
        characters[i].actions = actions
        characters[i].xp = xp
        characters[i].fatigue = fatigue

    return result

def generate_interleaved_combinations(character_combinations):
    """Generate all interleaved combinations of actions for all characters."""
    # Flatten combinations into a list of (character, action)
    character_action_sequences = {
        character: [(character, action) for action in actions]
        for character, actions in character_combinations.items()
    }

    # Interleave actions by taking all possible orderings
    all_interleaved_combinations = list(itertools.permutations(
        [action for actions in character_action_sequences.values() for action in actions],
        sum(len(actions) for actions in character_action_sequences.values())
    ))

    # Filter valid interleavings where each character respects their number of actions
    valid_combinations = []
    for sequence in all_interleaved_combinations:
        action_count = {character: 0 for character in character_combinations.keys()}
        valid = True
        for character, _ in sequence:
            action_count[character] += 1
            if action_count[character] > len(character_combinations[character]):
                valid = False
                break
        if valid:
            valid_combinations.append(sequence)

    return valid_combinations

def simulate_best_turn():
    """Simulate the best possible turn with interleaved actions."""
    weakest_two = get_two_weakest()
    targets = weakest_two

    # Generate all possible action combinations for each character
    character_combinations = {
        character: generate_action_combinations(character, targets) for character in characters if character.can_act()
    }

    # Generate all interleaved combinations of actions
    all_interleaved_combinations = generate_interleaved_combinations(character_combinations)

    # Print all interleaved combinations
    print("\nGenerated All Interleaved Combinations:")
    for i, combination in enumerate(all_interleaved_combinations, start=1):
        print(f"Combination {i}:")
        for character, action in combination:
            print(f"  {character.name} -> {action}")
        print()

    # Test each combination and find the best one
    best_result = None
    best_combination = None

    for combination in all_interleaved_combinations:
        result = resolve_combination(combination)
        if result[0] == -1:
            continue  # Skip invalid combinations

        if best_result is None or result[0] > best_result[0]:
            best_result = result
            best_combination = combination

    # Print the best combination
    print("\nBest Interleaved Combination:")
    for character, action in best_combination:
        print(f"{character.name} -> {action}")

    # Print final results
    print("\nFinal Results:")
    for char_name, xp, fatigue in best_result[1]:
        print(f"{char_name}: XP = {xp}, Fatigue = {fatigue}")


# Simulate the best turn
simulate_best_turn()
