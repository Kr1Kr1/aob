import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

class Character:
    def __init__(self, name, attributes, position, team):
        self.name = name
        self.attributes = attributes  # Dictionary of character attributes
        self.position = position
        self.team = team  # "ally" or "enemy"
        self.abilities = []  # List of abilities

class Ability:
    def __init__(self, name, damage, healing, range, magic_cost=0, cooldown=0):
        self.name = name
        self.damage = damage
        self.healing = healing
        self.range = range
        self.magic_cost = magic_cost
        self.cooldown = cooldown
        self.remaining_cooldown = 0

    def use(self, user):
        if self.remaining_cooldown == 0 and user.attributes["PM"] >= self.magic_cost:
            self.remaining_cooldown = self.cooldown
            user.attributes["PM"] -= self.magic_cost
            return True
        return False

def parse_board(html_content):
    """Parse the board HTML to extract player positions, roles, and categories."""
    soup = BeautifulSoup(html_content, "html.parser")
    players = []

    for image in soup.find_all("image", {"id": lambda x: x and x.startswith("players")}):
        player_id = int(image["id"].replace("players", ""))
        x = int(image["x"]) // 50  # Convert pixel position to grid position
        y = int(image["y"]) // 50
        role = "ally" if player_id > 0 else "enemy"

        # Extract category from href
        href = image.get("href", "")
        category = "unknown"
        if "nain" in href:
            category = "nain"
        elif "dieu" in href:
            category = "dieu"
            role = "neutral"  # Dieu are neutral, not fighters
        elif "lutin" in href:
            category = "lutin"
        elif "animal" in href:
            category = "animal"

        player = {"id": player_id, "role": role, "position": (x, y), "category": category}
        if player not in players:
            players.append(player)

    return players

def evaluate_board(players):
    """Return all players on the board since Glenefal sees the entire board."""
    return players

def evaluate_options(character, allies, enemies, events):
    """Evaluate the best actions for the character based on current stats."""
    options = []

    # If no actions are available, consider replenishing or retreating
    if character.attributes["A"] == 0:
        if character.attributes["Pi"] > 0:
            options.append(("Use Pi to regain actions", 30))  # High priority
        if character.attributes["Mvt"] > 0:
            options.append(("Retreat to safe position", 25))
        return options

    # Evaluate abilities
    for ability in character.abilities:
        if ability.remaining_cooldown > 0:
            continue

        # Base score calculation
        score = 0

        # Prioritize healing if health is low
        if character.attributes["PV"] < 20 and ability.healing > 0:
            score += ability.healing * 2

        # Damage evaluation
        if ability.damage > 0:
            score += evaluate_damage(character, ability, enemies)

        # Penalize abilities requiring significant resources
        if ability.magic_cost > 0:
            score -= ability.magic_cost

        options.append((ability.name, score))

    # Add defensive options
    if character.attributes["PV"] < 20:
        options.append(("Defend", 20))  # Use defend action if available

    # Check for Nain-specific ability "Barbier"
    if character.attributes["Agi"] > 0:
        for ally in allies:
            if is_in_range(character.position, ally["position"], 1):
                healing = character.attributes["Agi"]
                options.append((f"Use Barbier on ally {ally['id']} (Heal {healing} HP)", 25))

    # Sort options by score
    options.sort(key=lambda x: x[1], reverse=True)
    return options

def evaluate_damage(character, ability, enemies):
    """Evaluate damage potential for an ability."""
    score = 0
    for enemy in enemies:
        if is_in_range(character.position, enemy["position"], ability.range):
            score += ability.damage + character.attributes["CC"]
    return score

def is_in_range(pos1, pos2, range):
    """Check if two positions are within a certain range."""
    return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1]) <= range

def schedule_next_turn(turn_time):
    """Notify the user when their next turn is approaching."""
    now = datetime.now()
    next_turn = datetime.strptime(turn_time, "%H:%M")
    if next_turn < now:
        next_turn += timedelta(days=1)  # Schedule for the next day if time has passed

    time_until_next_turn = (next_turn - now).total_seconds()
    print(f"Next turn scheduled for: {next_turn.strftime('%Y-%m-%d %H:%M:%S')}")

    # Sleep until 10 minutes before the next turn
    time_to_notify = max(0, time_until_next_turn - 600)  # Notify 10 minutes before
    time.sleep(time_to_notify)
    print("Your next turn is approaching! Prepare your actions.")

if __name__ == "__main__":
    # Glenefal's stats and abilities
    glenefal_attributes = {
        "A": 0, "Mvt": -1, "P": 5, "PV": 17, "CC": 12, "CT": 8, "F": 12,
        "E": 7, "Agi": 6, "PM": 15, "FM": 11, "M": 11, "R": 3, "RM": 5,
        "Ae": 0, "Foi": 0, "Xp": 1919, "Pi": 909
    }

    glenefal = Character("Glenefal", glenefal_attributes, position=(0, 0), team="ally")
    glenefal.abilities = [
        Ability("Magic Heal", damage=0, healing=15, range=3, magic_cost=10),
        Ability("Fireball", damage=25, healing=0, range=2, magic_cost=8),
        Ability("Slash", damage=20, healing=0, range=1)
    ]

    # Set default attributes for all "nain" allies
    nain_attributes = {
        "A": 3, "Mvt": 4, "P": 5, "PV": 50, "CC": 12, "CT": 8, "F": 12,
        "E": 7, "Agi": 6, "PM": 15, "FM": 11, "M": 11, "R": 3, "RM": 5,
        "Ae": 0, "Foi": 0, "Xp": 0, "Pi": 0
    }

    # Load board data from HTML file
    with open("board.html", "r", encoding="utf-8") as f:
        html_content = f.read()

    # Parse board and extract players
    players = parse_board(html_content)
    print("All players on the board:")
    for player in players:
        print(f"ID: {player['id']}, Role: {player['role']}, Position: {player['position']}, Category: {player['category']}")

    # Update "nain" allies to have default nain attributes
    for player in players:
        if player["category"] == "nain" and player["role"] == "ally":
            player["attributes"] = nain_attributes

    # Since Glenefal sees the whole board, all players are visible
    visible_players = evaluate_board(players)
    print("\nVisible players within perception range:")
    for player in visible_players:
        print(f"ID: {player['id']}, Role: {player['role']}, Position: {player['position']}, Category: {player['category']}")

    # Separate visible allies and enemies
    visible_allies = [p for p in visible_players if p["role"] == "ally"]
    visible_enemies = [p for p in visible_players if p["role"] == "enemy"]

    # Evaluate Glenefal's options based on visible players
    options = evaluate_options(glenefal, visible_allies, visible_enemies, [])
    print("\nBest options:")
    for option, score in options:
        print(f"- {option} (Score: {score})")

    # Schedule next turn
    schedule_next_turn("23:04")
