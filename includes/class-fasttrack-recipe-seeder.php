<?php
/**
 * Recipe Seeder Class
 *
 * Generates and seeds 100+ default recipes across multiple categories.
 *
 * @package    FastTrack
 * @since      2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_Recipe_Seeder {
    
    private $manager;
    
    // Unsplash image URLs by category
    private $images = array(
        'breakfast' => array(
            'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600',
            'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600',
            'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600',
            'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600',
            'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=600',
        ),
        'lunch' => array(
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=600',
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
        ),
        'dinner' => array(
            'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600',
            'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
            'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600',
            'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600',
        ),
        'snack' => array(
            'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600',
            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
            'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
            'https://images.unsplash.com/photo-1470119693884-47d3a1d1f180?w=600',
            'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600',
        ),
    );
    
    public function __construct() {
        require_once plugin_dir_path(__FILE__) . 'class-fasttrack-recipes-manager.php';
        $this->manager = new FastTrack_Recipes_Manager();
    }
    
    /**
     * Seed all recipes
     */
    public function seed_all() {
        // Seed categories first
        $this->manager->seed_categories();
        
        $total = 0;
        
        // Seed by meal type (25 each = 100)
        $total += $this->seed_breakfast_recipes();
        $total += $this->seed_lunch_recipes();
        $total += $this->seed_dinner_recipes();
        $total += $this->seed_snack_recipes();
        
        // Seed by diet type with meal variety (20 more unique)
        $total += $this->seed_diet_specific_recipes();
        
        return array('total' => $total);
    }
    
    private function seed_breakfast_recipes() {
        $recipes = array(
            array('name' => 'Avocado Toast with Poached Eggs', 'desc' => 'Creamy avocado on sourdough topped with perfectly poached eggs.', 'prep' => 10, 'cook' => 5, 'cal' => 380, 'protein' => 16, 'carbs' => 28, 'fat' => 24, 'diet' => 'vegetarian', 'goal' => 'energy-boost', 'tags' => array('quick', 'protein', 'healthy-fats')),
            array('name' => 'Greek Yogurt Parfait', 'desc' => 'Layers of creamy yogurt, fresh berries, and crunchy granola.', 'prep' => 5, 'cook' => 0, 'cal' => 320, 'protein' => 20, 'carbs' => 42, 'fat' => 8, 'diet' => 'vegetarian', 'goal' => 'gut-health', 'tags' => array('probiotics', 'quick', 'protein')),
            array('name' => 'Keto Bacon & Eggs', 'desc' => 'Classic breakfast with crispy bacon and scrambled eggs.', 'prep' => 5, 'cook' => 10, 'cal' => 450, 'protein' => 28, 'carbs' => 2, 'fat' => 36, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'high-protein', 'low-carb')),
            array('name' => 'Overnight Oats with Berries', 'desc' => 'Creamy oats soaked overnight with mixed berries and honey.', 'prep' => 5, 'cook' => 0, 'cal' => 350, 'protein' => 12, 'carbs' => 55, 'fat' => 10, 'diet' => 'vegetarian', 'goal' => 'energy-boost', 'tags' => array('meal-prep', 'fiber', 'vegan-option')),
            array('name' => 'Spinach & Feta Omelette', 'desc' => 'Fluffy eggs filled with fresh spinach and tangy feta cheese.', 'prep' => 5, 'cook' => 8, 'cal' => 340, 'protein' => 24, 'carbs' => 4, 'fat' => 26, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'vegetarian', 'protein')),
            array('name' => 'Banana Protein Pancakes', 'desc' => 'Fluffy pancakes made with oats, banana, and protein powder.', 'prep' => 10, 'cook' => 15, 'cal' => 420, 'protein' => 30, 'carbs' => 48, 'fat' => 12, 'diet' => 'vegetarian', 'goal' => 'muscle-building', 'tags' => array('protein', 'post-workout', 'sweet')),
            array('name' => 'Smoked Salmon Bagel', 'desc' => 'Toasted bagel with cream cheese, smoked salmon, and capers.', 'prep' => 10, 'cook' => 0, 'cal' => 480, 'protein' => 28, 'carbs' => 38, 'fat' => 22, 'diet' => 'mediterranean', 'goal' => 'heart-health', 'tags' => array('omega-3', 'quick', 'seafood')),
            array('name' => 'Chia Seed Pudding', 'desc' => 'Creamy coconut chia pudding topped with fresh mango.', 'prep' => 5, 'cook' => 0, 'cal' => 280, 'protein' => 8, 'carbs' => 32, 'fat' => 14, 'diet' => 'vegan', 'goal' => 'gut-health', 'tags' => array('vegan', 'fiber', 'meal-prep')),
            array('name' => 'Veggie Breakfast Burrito', 'desc' => 'Scrambled eggs with peppers, onions, and cheese in a warm tortilla.', 'prep' => 10, 'cook' => 12, 'cal' => 450, 'protein' => 22, 'carbs' => 38, 'fat' => 24, 'diet' => 'vegetarian', 'goal' => 'energy-boost', 'tags' => array('protein', 'vegetarian', 'filling')),
            array('name' => 'Acai Bowl', 'desc' => 'Frozen acai blend topped with granola, banana, and honey.', 'prep' => 10, 'cook' => 0, 'cal' => 380, 'protein' => 8, 'carbs' => 62, 'fat' => 12, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'antioxidants', 'refreshing')),
            array('name' => 'Eggs Benedict', 'desc' => 'Poached eggs on English muffins with Canadian bacon and hollandaise.', 'prep' => 15, 'cook' => 20, 'cal' => 520, 'protein' => 26, 'carbs' => 28, 'fat' => 34, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('protein', 'indulgent', 'brunch')),
            array('name' => 'Cottage Cheese Bowl', 'desc' => 'High-protein cottage cheese with peaches and a drizzle of honey.', 'prep' => 5, 'cook' => 0, 'cal' => 240, 'protein' => 24, 'carbs' => 18, 'fat' => 6, 'diet' => 'vegetarian', 'goal' => 'weight-loss', 'tags' => array('protein', 'quick', 'low-fat')),
            array('name' => 'Shakshuka', 'desc' => 'Eggs poached in spiced tomato sauce with bell peppers.', 'prep' => 10, 'cook' => 20, 'cal' => 320, 'protein' => 18, 'carbs' => 22, 'fat' => 18, 'diet' => 'mediterranean', 'goal' => 'energy-boost', 'tags' => array('vegetarian', 'spicy', 'one-pan')),
            array('name' => 'Almond Butter Toast', 'desc' => 'Whole grain toast with almond butter, banana slices, and chia seeds.', 'prep' => 5, 'cook' => 2, 'cal' => 380, 'protein' => 12, 'carbs' => 42, 'fat' => 20, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'healthy-fats', 'quick')),
            array('name' => 'Breakfast Quinoa Bowl', 'desc' => 'Warm quinoa with almond milk, cinnamon, and fresh berries.', 'prep' => 5, 'cook' => 15, 'cal' => 320, 'protein' => 12, 'carbs' => 48, 'fat' => 8, 'diet' => 'vegan', 'goal' => 'gut-health', 'tags' => array('vegan', 'gluten-free', 'fiber')),
            array('name' => 'Bacon Avocado Eggs', 'desc' => 'Crispy bacon with fried eggs served over mashed avocado.', 'prep' => 5, 'cook' => 12, 'cal' => 480, 'protein' => 28, 'carbs' => 6, 'fat' => 38, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'paleo', 'protein')),
            array('name' => 'Blueberry Smoothie Bowl', 'desc' => 'Thick blueberry smoothie topped with granola and coconut flakes.', 'prep' => 10, 'cook' => 0, 'cal' => 340, 'protein' => 10, 'carbs' => 52, 'fat' => 12, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'antioxidants', 'refreshing')),
            array('name' => 'Turkish Eggs (Cilbir)', 'desc' => 'Poached eggs over garlic yogurt with spiced butter.', 'prep' => 10, 'cook' => 10, 'cal' => 380, 'protein' => 18, 'carbs' => 8, 'fat' => 32, 'diet' => 'vegetarian', 'goal' => 'gut-health', 'tags' => array('probiotics', 'protein', 'unique')),
            array('name' => 'Sweet Potato Hash', 'desc' => 'Crispy sweet potato cubes with onions, peppers, and eggs.', 'prep' => 15, 'cook' => 25, 'cal' => 420, 'protein' => 16, 'carbs' => 48, 'fat' => 18, 'diet' => 'paleo', 'goal' => 'energy-boost', 'tags' => array('paleo', 'whole30', 'hearty')),
            array('name' => 'Protein Smoothie', 'desc' => 'Chocolate protein shake with banana, peanut butter, and oats.', 'prep' => 5, 'cook' => 0, 'cal' => 450, 'protein' => 35, 'carbs' => 45, 'fat' => 15, 'diet' => 'vegetarian', 'goal' => 'muscle-building', 'tags' => array('protein', 'post-workout', 'quick')),
            array('name' => 'French Toast', 'desc' => 'Classic French toast with maple syrup and fresh berries.', 'prep' => 10, 'cook' => 15, 'cal' => 480, 'protein' => 16, 'carbs' => 58, 'fat' => 20, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('sweet', 'indulgent', 'brunch')),
            array('name' => 'Egg White Veggie Scramble', 'desc' => 'Light egg whites scrambled with mushrooms, tomatoes, and herbs.', 'prep' => 5, 'cook' => 8, 'cal' => 180, 'protein' => 22, 'carbs' => 8, 'fat' => 6, 'diet' => 'vegetarian', 'goal' => 'weight-loss', 'tags' => array('low-calorie', 'protein', 'quick')),
            array('name' => 'Granola & Milk Bowl', 'desc' => 'Homemade granola clusters with cold almond milk.', 'prep' => 2, 'cook' => 0, 'cal' => 380, 'protein' => 10, 'carbs' => 52, 'fat' => 16, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'fiber', 'quick')),
            array('name' => 'Breakfast Sausage Patties', 'desc' => 'Homemade pork sausage patties with herbs and spices.', 'prep' => 10, 'cook' => 12, 'cal' => 320, 'protein' => 22, 'carbs' => 2, 'fat' => 26, 'diet' => 'keto', 'goal' => 'muscle-building', 'tags' => array('keto', 'paleo', 'protein')),
            array('name' => 'Mango Lassi', 'desc' => 'Traditional Indian yogurt drink with fresh mango and cardamom.', 'prep' => 5, 'cook' => 0, 'cal' => 280, 'protein' => 12, 'carbs' => 42, 'fat' => 8, 'diet' => 'vegetarian', 'goal' => 'gut-health', 'tags' => array('probiotics', 'refreshing', 'sweet')),
        );
        
        return $this->insert_recipes($recipes, 'breakfast', true);
    }
    
    private function seed_lunch_recipes() {
        $recipes = array(
            array('name' => 'Grilled Chicken Caesar Salad', 'desc' => 'Crisp romaine with grilled chicken, parmesan, and creamy dressing.', 'prep' => 15, 'cook' => 15, 'cal' => 420, 'protein' => 38, 'carbs' => 12, 'fat' => 26, 'diet' => '', 'goal' => 'weight-loss', 'tags' => array('protein', 'classic', 'salad')),
            array('name' => 'Mediterranean Quinoa Bowl', 'desc' => 'Fluffy quinoa with cucumber, tomatoes, olives, and feta.', 'prep' => 15, 'cook' => 20, 'cal' => 380, 'protein' => 14, 'carbs' => 48, 'fat' => 16, 'diet' => 'mediterranean', 'goal' => 'heart-health', 'tags' => array('vegetarian', 'fiber', 'filling')),
            array('name' => 'Turkey Avocado Wrap', 'desc' => 'Sliced turkey with avocado, lettuce, and honey mustard in a spinach wrap.', 'prep' => 10, 'cook' => 0, 'cal' => 420, 'protein' => 32, 'carbs' => 28, 'fat' => 22, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('protein', 'quick', 'portable')),
            array('name' => 'Asian Chicken Lettuce Wraps', 'desc' => 'Savory ground chicken in crisp lettuce cups with ginger sauce.', 'prep' => 10, 'cook' => 15, 'cal' => 320, 'protein' => 28, 'carbs' => 18, 'fat' => 14, 'diet' => 'paleo', 'goal' => 'weight-loss', 'tags' => array('low-carb', 'asian', 'protein')),
            array('name' => 'Greek Salad with Grilled Shrimp', 'desc' => 'Fresh salad with juicy grilled shrimp, feta, and olives.', 'prep' => 15, 'cook' => 10, 'cal' => 380, 'protein' => 32, 'carbs' => 14, 'fat' => 24, 'diet' => 'mediterranean', 'goal' => 'weight-loss', 'tags' => array('seafood', 'protein', 'fresh')),
            array('name' => 'Vegetable Stir-Fry', 'desc' => 'Colorful vegetables wok-fried with tofu and soy sauce.', 'prep' => 15, 'cook' => 12, 'cal' => 280, 'protein' => 16, 'carbs' => 32, 'fat' => 12, 'diet' => 'vegan', 'goal' => 'weight-loss', 'tags' => array('vegan', 'quick', 'vegetables')),
            array('name' => 'Tuna Nicoise Salad', 'desc' => 'French-style salad with seared tuna, eggs, olives, and potatoes.', 'prep' => 20, 'cook' => 15, 'cal' => 450, 'protein' => 36, 'carbs' => 28, 'fat' => 22, 'diet' => 'mediterranean', 'goal' => 'heart-health', 'tags' => array('omega-3', 'protein', 'classic')),
            array('name' => 'Black Bean Tacos', 'desc' => 'Seasoned black beans in corn tortillas with fresh salsa and lime.', 'prep' => 10, 'cook' => 15, 'cal' => 380, 'protein' => 16, 'carbs' => 52, 'fat' => 12, 'diet' => 'vegan', 'goal' => 'gut-health', 'tags' => array('vegan', 'fiber', 'mexican')),
            array('name' => 'Salmon Poke Bowl', 'desc' => 'Fresh salmon cubes over rice with avocado and edamame.', 'prep' => 20, 'cook' => 0, 'cal' => 480, 'protein' => 32, 'carbs' => 42, 'fat' => 22, 'diet' => '', 'goal' => 'heart-health', 'tags' => array('omega-3', 'fresh', 'japanese')),
            array('name' => 'Chicken Soup', 'desc' => 'Homemade chicken soup with vegetables and herbs.', 'prep' => 15, 'cook' => 40, 'cal' => 280, 'protein' => 24, 'carbs' => 22, 'fat' => 10, 'diet' => 'paleo', 'goal' => 'gut-health', 'tags' => array('comforting', 'healing', 'classic')),
            array('name' => 'Caprese Panini', 'desc' => 'Grilled sandwich with fresh mozzarella, tomato, and basil pesto.', 'prep' => 10, 'cook' => 8, 'cal' => 480, 'protein' => 22, 'carbs' => 38, 'fat' => 28, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('italian', 'vegetarian', 'grilled')),
            array('name' => 'Keto Cobb Salad', 'desc' => 'Loaded salad with bacon, eggs, avocado, and blue cheese.', 'prep' => 20, 'cook' => 15, 'cal' => 520, 'protein' => 36, 'carbs' => 10, 'fat' => 40, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'protein', 'filling')),
            array('name' => 'Falafel Pita', 'desc' => 'Crispy falafel in warm pita with tahini and fresh vegetables.', 'prep' => 20, 'cook' => 15, 'cal' => 450, 'protein' => 18, 'carbs' => 52, 'fat' => 20, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'middle-eastern', 'protein')),
            array('name' => 'Beef & Broccoli', 'desc' => 'Tender beef strips with broccoli in savory garlic sauce.', 'prep' => 15, 'cook' => 15, 'cal' => 380, 'protein' => 32, 'carbs' => 18, 'fat' => 20, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('protein', 'asian', 'quick')),
            array('name' => 'Lentil Soup', 'desc' => 'Hearty soup with red lentils, carrots, and warming spices.', 'prep' => 10, 'cook' => 35, 'cal' => 320, 'protein' => 18, 'carbs' => 42, 'fat' => 8, 'diet' => 'vegan', 'goal' => 'gut-health', 'tags' => array('vegan', 'fiber', 'comforting')),
            array('name' => 'Shrimp Tacos', 'desc' => 'Grilled shrimp in corn tortillas with mango salsa and slaw.', 'prep' => 15, 'cook' => 10, 'cal' => 380, 'protein' => 28, 'carbs' => 32, 'fat' => 16, 'diet' => '', 'goal' => 'weight-loss', 'tags' => array('seafood', 'mexican', 'fresh')),
            array('name' => 'Buddha Bowl', 'desc' => 'Nourishing bowl with grains, roasted vegetables, and tahini.', 'prep' => 20, 'cook' => 30, 'cal' => 420, 'protein' => 14, 'carbs' => 52, 'fat' => 18, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'colorful', 'filling')),
            array('name' => 'Vietnamese Pho', 'desc' => 'Aromatic beef noodle soup with fresh herbs and lime.', 'prep' => 15, 'cook' => 45, 'cal' => 420, 'protein' => 28, 'carbs' => 48, 'fat' => 12, 'diet' => '', 'goal' => '', 'tags' => array('vietnamese', 'comforting', 'soup')),
            array('name' => 'Egg Salad Sandwich', 'desc' => 'Creamy egg salad with herbs on whole grain bread.', 'prep' => 15, 'cook' => 12, 'cal' => 420, 'protein' => 20, 'carbs' => 32, 'fat' => 26, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('classic', 'protein', 'quick')),
            array('name' => 'Thai Peanut Noodles', 'desc' => 'Rice noodles tossed in spicy peanut sauce with vegetables.', 'prep' => 15, 'cook' => 12, 'cal' => 480, 'protein' => 16, 'carbs' => 58, 'fat' => 22, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'thai', 'spicy')),
            array('name' => 'Hummus & Veggie Plate', 'desc' => 'Creamy hummus with fresh cut vegetables and warm pita.', 'prep' => 10, 'cook' => 0, 'cal' => 320, 'protein' => 12, 'carbs' => 38, 'fat' => 16, 'diet' => 'vegan', 'goal' => 'gut-health', 'tags' => array('vegan', 'fiber', 'snackable')),
            array('name' => 'Chicken Quesadilla', 'desc' => 'Cheesy quesadilla with seasoned chicken and peppers.', 'prep' => 10, 'cook' => 15, 'cal' => 520, 'protein' => 36, 'carbs' => 38, 'fat' => 28, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('mexican', 'protein', 'cheesy')),
            array('name' => 'Gazpacho', 'desc' => 'Chilled Spanish tomato soup with cucumber and peppers.', 'prep' => 20, 'cook' => 0, 'cal' => 120, 'protein' => 4, 'carbs' => 18, 'fat' => 6, 'diet' => 'vegan', 'goal' => 'weight-loss', 'tags' => array('vegan', 'refreshing', 'low-calorie')),
            array('name' => 'BLT Sandwich', 'desc' => 'Classic bacon, lettuce, and tomato on toasted bread.', 'prep' => 10, 'cook' => 8, 'cal' => 450, 'protein' => 18, 'carbs' => 32, 'fat' => 28, 'diet' => '', 'goal' => '', 'tags' => array('classic', 'quick', 'satisfying')),
            array('name' => 'Moroccan Chickpea Stew', 'desc' => 'Spiced chickpeas with tomatoes, apricots, and warming spices.', 'prep' => 15, 'cook' => 35, 'cal' => 380, 'protein' => 14, 'carbs' => 52, 'fat' => 14, 'diet' => 'vegan', 'goal' => 'gut-health', 'tags' => array('vegan', 'fiber', 'moroccan')),
        );
        
        return $this->insert_recipes($recipes, 'lunch', false);
    }
    
    private function seed_dinner_recipes() {
        $recipes = array(
            array('name' => 'Grilled Salmon with Asparagus', 'desc' => 'Perfectly grilled salmon fillet with roasted asparagus.', 'prep' => 10, 'cook' => 20, 'cal' => 420, 'protein' => 38, 'carbs' => 8, 'fat' => 26, 'diet' => 'keto', 'goal' => 'heart-health', 'tags' => array('omega-3', 'keto', 'protein')),
            array('name' => 'Chicken Stir-Fry', 'desc' => 'Tender chicken with colorful vegetables in ginger-garlic sauce.', 'prep' => 15, 'cook' => 15, 'cal' => 380, 'protein' => 34, 'carbs' => 22, 'fat' => 18, 'diet' => 'paleo', 'goal' => 'weight-loss', 'tags' => array('asian', 'protein', 'quick')),
            array('name' => 'Spaghetti Bolognese', 'desc' => 'Classic Italian meat sauce over al dente pasta.', 'prep' => 15, 'cook' => 45, 'cal' => 580, 'protein' => 32, 'carbs' => 62, 'fat' => 22, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('italian', 'classic', 'comfort')),
            array('name' => 'Baked Cod with Vegetables', 'desc' => 'Flaky cod baked with cherry tomatoes and Mediterranean herbs.', 'prep' => 10, 'cook' => 25, 'cal' => 320, 'protein' => 36, 'carbs' => 12, 'fat' => 14, 'diet' => 'mediterranean', 'goal' => 'weight-loss', 'tags' => array('seafood', 'low-calorie', 'healthy')),
            array('name' => 'Beef Tacos', 'desc' => 'Seasoned ground beef in corn tortillas with fresh toppings.', 'prep' => 15, 'cook' => 20, 'cal' => 480, 'protein' => 28, 'carbs' => 38, 'fat' => 24, 'diet' => '', 'goal' => '', 'tags' => array('mexican', 'family-friendly', 'protein')),
            array('name' => 'Vegetable Curry', 'desc' => 'Creamy coconut curry with mixed vegetables and chickpeas.', 'prep' => 15, 'cook' => 30, 'cal' => 380, 'protein' => 12, 'carbs' => 42, 'fat' => 20, 'diet' => 'vegan', 'goal' => 'gut-health', 'tags' => array('vegan', 'indian', 'spicy')),
            array('name' => 'Pork Chops with Apple', 'desc' => 'Pan-seared pork chops with caramelized apples and sage.', 'prep' => 10, 'cook' => 25, 'cal' => 450, 'protein' => 36, 'carbs' => 18, 'fat' => 26, 'diet' => 'paleo', 'goal' => 'muscle-building', 'tags' => array('paleo', 'protein', 'autumn')),
            array('name' => 'Shrimp Scampi', 'desc' => 'Garlic butter shrimp over linguine with white wine sauce.', 'prep' => 10, 'cook' => 15, 'cal' => 520, 'protein' => 32, 'carbs' => 48, 'fat' => 22, 'diet' => '', 'goal' => '', 'tags' => array('seafood', 'italian', 'quick')),
            array('name' => 'Stuffed Bell Peppers', 'desc' => 'Bell peppers filled with ground turkey, rice, and cheese.', 'prep' => 20, 'cook' => 40, 'cal' => 420, 'protein' => 28, 'carbs' => 32, 'fat' => 22, 'diet' => '', 'goal' => 'weight-loss', 'tags' => array('protein', 'colorful', 'filling')),
            array('name' => 'Lamb Kebabs', 'desc' => 'Grilled lamb skewers with tzatziki and warm pita.', 'prep' => 20, 'cook' => 15, 'cal' => 480, 'protein' => 34, 'carbs' => 28, 'fat' => 26, 'diet' => 'mediterranean', 'goal' => 'muscle-building', 'tags' => array('greek', 'protein', 'grilled')),
            array('name' => 'Mushroom Risotto', 'desc' => 'Creamy arborio rice with wild mushrooms and parmesan.', 'prep' => 10, 'cook' => 35, 'cal' => 480, 'protein' => 14, 'carbs' => 58, 'fat' => 22, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('italian', 'vegetarian', 'comfort')),
            array('name' => 'Teriyaki Chicken', 'desc' => 'Glazed chicken thighs with steamed rice and broccoli.', 'prep' => 10, 'cook' => 25, 'cal' => 480, 'protein' => 36, 'carbs' => 42, 'fat' => 18, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('japanese', 'protein', 'sweet')),
            array('name' => 'Eggplant Parmesan', 'desc' => 'Breaded eggplant with marinara and melted mozzarella.', 'prep' => 25, 'cook' => 40, 'cal' => 420, 'protein' => 18, 'carbs' => 38, 'fat' => 24, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('italian', 'vegetarian', 'comfort')),
            array('name' => 'Beef Stew', 'desc' => 'Slow-cooked beef with potatoes, carrots, and rich gravy.', 'prep' => 20, 'cook' => 120, 'cal' => 480, 'protein' => 36, 'carbs' => 32, 'fat' => 24, 'diet' => '', 'goal' => '', 'tags' => array('comfort', 'slow-cooked', 'hearty')),
            array('name' => 'Cauliflower Fried Rice', 'desc' => 'Low-carb fried rice with riced cauliflower and vegetables.', 'prep' => 15, 'cook' => 15, 'cal' => 280, 'protein' => 18, 'carbs' => 16, 'fat' => 18, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'low-carb', 'asian')),
            array('name' => 'Chicken Parmesan', 'desc' => 'Breaded chicken cutlet with marinara and melted cheese.', 'prep' => 20, 'cook' => 30, 'cal' => 520, 'protein' => 42, 'carbs' => 28, 'fat' => 28, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('italian', 'protein', 'comfort')),
            array('name' => 'Fish Tacos', 'desc' => 'Crispy fish with cabbage slaw and chipotle crema.', 'prep' => 20, 'cook' => 15, 'cal' => 420, 'protein' => 28, 'carbs' => 38, 'fat' => 20, 'diet' => '', 'goal' => '', 'tags' => array('mexican', 'seafood', 'fresh')),
            array('name' => 'Pad Thai', 'desc' => 'Classic Thai noodles with shrimp, peanuts, and lime.', 'prep' => 20, 'cook' => 15, 'cal' => 520, 'protein' => 24, 'carbs' => 58, 'fat' => 22, 'diet' => '', 'goal' => '', 'tags' => array('thai', 'noodles', 'popular')),
            array('name' => 'Zucchini Noodles with Meatballs', 'desc' => 'Spiralized zucchini with turkey meatballs and marinara.', 'prep' => 20, 'cook' => 25, 'cal' => 380, 'protein' => 32, 'carbs' => 18, 'fat' => 22, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'low-carb', 'protein')),
            array('name' => 'Honey Garlic Chicken', 'desc' => 'Sticky honey garlic glazed chicken with steamed vegetables.', 'prep' => 10, 'cook' => 30, 'cal' => 420, 'protein' => 34, 'carbs' => 28, 'fat' => 20, 'diet' => '', 'goal' => '', 'tags' => array('asian', 'sweet', 'easy')),
            array('name' => 'Vegan Buddha Bowl', 'desc' => 'Tofu, quinoa, roasted vegetables, and tahini dressing.', 'prep' => 20, 'cook' => 30, 'cal' => 420, 'protein' => 18, 'carbs' => 48, 'fat' => 20, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'colorful', 'healthy')),
            array('name' => 'Steak with Chimichurri', 'desc' => 'Grilled ribeye steak with fresh herb chimichurri sauce.', 'prep' => 15, 'cook' => 15, 'cal' => 520, 'protein' => 42, 'carbs' => 4, 'fat' => 38, 'diet' => 'keto', 'goal' => 'muscle-building', 'tags' => array('keto', 'protein', 'argentinian')),
            array('name' => 'Lemon Herb Roast Chicken', 'desc' => 'Whole roasted chicken with lemon, garlic, and fresh herbs.', 'prep' => 15, 'cook' => 75, 'cal' => 380, 'protein' => 36, 'carbs' => 4, 'fat' => 24, 'diet' => 'paleo', 'goal' => 'muscle-building', 'tags' => array('paleo', 'classic', 'sunday')),
            array('name' => 'Thai Green Curry', 'desc' => 'Creamy coconut curry with chicken and Thai basil.', 'prep' => 15, 'cook' => 25, 'cal' => 480, 'protein' => 32, 'carbs' => 28, 'fat' => 30, 'diet' => '', 'goal' => '', 'tags' => array('thai', 'spicy', 'coconut')),
            array('name' => 'Mediterranean Baked Chicken', 'desc' => 'Chicken thighs baked with olives, sun-dried tomatoes, and feta.', 'prep' => 15, 'cook' => 35, 'cal' => 420, 'protein' => 38, 'carbs' => 12, 'fat' => 26, 'diet' => 'mediterranean', 'goal' => 'heart-health', 'tags' => array('mediterranean', 'one-pan', 'protein')),
        );
        
        return $this->insert_recipes($recipes, 'dinner', false);
    }
    
    private function seed_snack_recipes() {
        $recipes = array(
            array('name' => 'Energy Balls', 'desc' => 'No-bake oat and date balls with chocolate chips.', 'prep' => 15, 'cook' => 0, 'cal' => 120, 'protein' => 4, 'carbs' => 18, 'fat' => 6, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('no-bake', 'portable', 'sweet')),
            array('name' => 'Guacamole with Chips', 'desc' => 'Fresh avocado dip with lime, cilantro, and tortilla chips.', 'prep' => 10, 'cook' => 0, 'cal' => 280, 'protein' => 4, 'carbs' => 28, 'fat' => 20, 'diet' => 'vegan', 'goal' => '', 'tags' => array('mexican', 'party', 'healthy-fats')),
            array('name' => 'Deviled Eggs', 'desc' => 'Classic deviled eggs with paprika and chives.', 'prep' => 20, 'cook' => 12, 'cal' => 140, 'protein' => 12, 'carbs' => 2, 'fat' => 10, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'protein', 'classic')),
            array('name' => 'Protein Cookies', 'desc' => 'Soft cookies made with protein powder and almond butter.', 'prep' => 10, 'cook' => 12, 'cal' => 180, 'protein' => 14, 'carbs' => 16, 'fat' => 8, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('protein', 'sweet', 'portable')),
            array('name' => 'Veggie Sticks with Hummus', 'desc' => 'Crunchy carrots and celery with creamy hummus.', 'prep' => 10, 'cook' => 0, 'cal' => 180, 'protein' => 8, 'carbs' => 22, 'fat' => 8, 'diet' => 'vegan', 'goal' => 'weight-loss', 'tags' => array('vegan', 'crunchy', 'low-calorie')),
            array('name' => 'Apple with Almond Butter', 'desc' => 'Crisp apple slices with creamy almond butter.', 'prep' => 5, 'cook' => 0, 'cal' => 220, 'protein' => 6, 'carbs' => 28, 'fat' => 12, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('quick', 'healthy', 'sweet')),
            array('name' => 'Cheese & Crackers', 'desc' => 'Aged cheddar with whole grain crackers.', 'prep' => 5, 'cook' => 0, 'cal' => 260, 'protein' => 12, 'carbs' => 18, 'fat' => 16, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('quick', 'classic', 'satisfying')),
            array('name' => 'Trail Mix', 'desc' => 'Nuts, seeds, and dark chocolate chips blend.', 'prep' => 5, 'cook' => 0, 'cal' => 280, 'protein' => 8, 'carbs' => 24, 'fat' => 20, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('portable', 'hiking', 'nuts')),
            array('name' => 'Greek Yogurt with Honey', 'desc' => 'Thick yogurt drizzled with raw honey and walnuts.', 'prep' => 3, 'cook' => 0, 'cal' => 220, 'protein' => 16, 'carbs' => 22, 'fat' => 8, 'diet' => 'vegetarian', 'goal' => 'gut-health', 'tags' => array('probiotics', 'quick', 'protein')),
            array('name' => 'Keto Fat Bombs', 'desc' => 'Chocolate coconut fat bombs for ketogenic diet.', 'prep' => 15, 'cook' => 0, 'cal' => 140, 'protein' => 2, 'carbs' => 2, 'fat' => 14, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'chocolate', 'no-bake')),
            array('name' => 'Edamame', 'desc' => 'Steamed soybeans with sea salt.', 'prep' => 2, 'cook' => 5, 'cal' => 120, 'protein' => 12, 'carbs' => 10, 'fat' => 5, 'diet' => 'vegan', 'goal' => 'weight-loss', 'tags' => array('vegan', 'protein', 'asian')),
            array('name' => 'Bruschetta', 'desc' => 'Toasted bread topped with fresh tomatoes and basil.', 'prep' => 15, 'cook' => 5, 'cal' => 180, 'protein' => 4, 'carbs' => 24, 'fat' => 8, 'diet' => 'vegan', 'goal' => '', 'tags' => array('italian', 'party', 'fresh')),
            array('name' => 'Stuffed Dates', 'desc' => 'Medjool dates stuffed with goat cheese and pecans.', 'prep' => 10, 'cook' => 0, 'cal' => 160, 'protein' => 4, 'carbs' => 22, 'fat' => 8, 'diet' => 'vegetarian', 'goal' => 'energy-boost', 'tags' => array('sweet', 'elegant', 'party')),
            array('name' => 'Protein Shake', 'desc' => 'Quick vanilla protein shake with banana.', 'prep' => 5, 'cook' => 0, 'cal' => 240, 'protein' => 28, 'carbs' => 24, 'fat' => 4, 'diet' => '', 'goal' => 'muscle-building', 'tags' => array('protein', 'post-workout', 'quick')),
            array('name' => 'Caprese Skewers', 'desc' => 'Mini skewers with cherry tomatoes, mozzarella, and basil.', 'prep' => 10, 'cook' => 0, 'cal' => 160, 'protein' => 10, 'carbs' => 6, 'fat' => 12, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('italian', 'party', 'elegant')),
            array('name' => 'Roasted Chickpeas', 'desc' => 'Crunchy spiced roasted chickpeas.', 'prep' => 5, 'cook' => 30, 'cal' => 180, 'protein' => 8, 'carbs' => 28, 'fat' => 4, 'diet' => 'vegan', 'goal' => 'gut-health', 'tags' => array('vegan', 'fiber', 'crunchy')),
            array('name' => 'Avocado Toast Bites', 'desc' => 'Mini toasts topped with mashed avocado and everything seasoning.', 'prep' => 10, 'cook' => 5, 'cal' => 160, 'protein' => 4, 'carbs' => 16, 'fat' => 10, 'diet' => 'vegan', 'goal' => '', 'tags' => array('vegan', 'party', 'trendy')),
            array('name' => 'Beef Jerky', 'desc' => 'Homemade lean beef jerky with teriyaki flavor.', 'prep' => 20, 'cook' => 240, 'cal' => 120, 'protein' => 22, 'carbs' => 4, 'fat' => 3, 'diet' => 'paleo', 'goal' => 'muscle-building', 'tags' => array('protein', 'portable', 'paleo')),
            array('name' => 'Cottage Cheese with Fruit', 'desc' => 'Creamy cottage cheese with fresh pineapple.', 'prep' => 5, 'cook' => 0, 'cal' => 180, 'protein' => 20, 'carbs' => 16, 'fat' => 4, 'diet' => 'vegetarian', 'goal' => 'weight-loss', 'tags' => array('protein', 'quick', 'refreshing')),
            array('name' => 'Cucumber Bites', 'desc' => 'Cucumber rounds topped with cream cheese and smoked salmon.', 'prep' => 15, 'cook' => 0, 'cal' => 120, 'protein' => 10, 'carbs' => 4, 'fat' => 8, 'diet' => 'keto', 'goal' => 'weight-loss', 'tags' => array('keto', 'elegant', 'seafood')),
            array('name' => 'Dark Chocolate Almonds', 'desc' => 'Roasted almonds covered in dark chocolate.', 'prep' => 10, 'cook' => 0, 'cal' => 220, 'protein' => 6, 'carbs' => 18, 'fat' => 16, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('chocolate', 'antioxidants', 'sweet')),
            array('name' => 'Spinach Artichoke Dip', 'desc' => 'Creamy warm dip with spinach and artichoke hearts.', 'prep' => 10, 'cook' => 25, 'cal' => 180, 'protein' => 8, 'carbs' => 12, 'fat' => 14, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('party', 'creamy', 'warm')),
            array('name' => 'Rice Cakes with Peanut Butter', 'desc' => 'Light rice cakes spread with peanut butter and banana.', 'prep' => 5, 'cook' => 0, 'cal' => 200, 'protein' => 8, 'carbs' => 28, 'fat' => 8, 'diet' => 'vegan', 'goal' => 'energy-boost', 'tags' => array('vegan', 'quick', 'crunchy')),
            array('name' => 'Smoked Salmon Rolls', 'desc' => 'Smoked salmon rolled with cream cheese and dill.', 'prep' => 15, 'cook' => 0, 'cal' => 180, 'protein' => 16, 'carbs' => 2, 'fat' => 12, 'diet' => 'keto', 'goal' => 'heart-health', 'tags' => array('omega-3', 'keto', 'elegant')),
            array('name' => 'Frozen Yogurt Bark', 'desc' => 'Frozen Greek yogurt with berries and granola.', 'prep' => 10, 'cook' => 0, 'cal' => 160, 'protein' => 10, 'carbs' => 22, 'fat' => 4, 'diet' => 'vegetarian', 'goal' => '', 'tags' => array('frozen', 'sweet', 'refreshing')),
        );
        
        return $this->insert_recipes($recipes, 'snack', false);
    }
    
    private function seed_diet_specific_recipes() {
        $recipes = array(
            // Breaking fast specific recipes
            array('name' => 'Bone Broth', 'desc' => 'Rich homemade bone broth, gentle on the stomach after fasting.', 'prep' => 10, 'cook' => 480, 'cal' => 80, 'protein' => 10, 'carbs' => 2, 'fat' => 4, 'diet' => 'paleo', 'goal' => 'gut-health', 'meal' => 'lunch', 'breaking' => true, 'tags' => array('gut-healing', 'collagen', 'gentle')),
            array('name' => 'Soft Scrambled Eggs', 'desc' => 'Creamy soft scrambled eggs, perfect for breaking your fast.', 'prep' => 2, 'cook' => 5, 'cal' => 220, 'protein' => 14, 'carbs' => 2, 'fat' => 18, 'diet' => 'keto', 'goal' => 'weight-loss', 'meal' => 'breakfast', 'breaking' => true, 'tags' => array('gentle', 'protein', 'easy-digest')),
            array('name' => 'Avocado Salmon Bites', 'desc' => 'Fresh salmon cubes with avocado, ideal for breaking longer fasts.', 'prep' => 15, 'cook' => 0, 'cal' => 320, 'protein' => 22, 'carbs' => 8, 'fat' => 24, 'diet' => 'keto', 'goal' => 'heart-health', 'meal' => 'lunch', 'breaking' => true, 'tags' => array('omega-3', 'healthy-fats', 'raw')),
            array('name' => 'Vegetable Soup', 'desc' => 'Light vegetable soup, easy to digest after fasting.', 'prep' => 15, 'cook' => 30, 'cal' => 150, 'protein' => 6, 'carbs' => 22, 'fat' => 4, 'diet' => 'vegan', 'goal' => 'gut-health', 'meal' => 'lunch', 'breaking' => true, 'tags' => array('gentle', 'vegetables', 'warming')),
            array('name' => 'Greek Salad Light', 'desc' => 'Fresh cucumber, tomato, and feta salad with olive oil.', 'prep' => 10, 'cook' => 0, 'cal' => 180, 'protein' => 8, 'carbs' => 12, 'fat' => 14, 'diet' => 'mediterranean', 'goal' => 'weight-loss', 'meal' => 'lunch', 'breaking' => true, 'tags' => array('fresh', 'light', 'mediterranean')),
            
            // More diet-specific unique recipes
            array('name' => 'Keto Cheese Crisps', 'desc' => 'Crispy baked cheese wafers for snacking.', 'prep' => 5, 'cook' => 10, 'cal' => 180, 'protein' => 14, 'carbs' => 1, 'fat' => 14, 'diet' => 'keto', 'goal' => 'weight-loss', 'meal' => 'snack', 'tags' => array('keto', 'crispy', 'cheese')),
            array('name' => 'Paleo Sweet Potato Mash', 'desc' => 'Creamy mashed sweet potatoes with coconut oil.', 'prep' => 10, 'cook' => 25, 'cal' => 240, 'protein' => 4, 'carbs' => 38, 'fat' => 10, 'diet' => 'paleo', 'goal' => 'energy-boost', 'meal' => 'dinner', 'tags' => array('paleo', 'comfort', 'whole30')),
            array('name' => 'Vegan Protein Bowl', 'desc' => 'Quinoa bowl with tempeh, roasted vegetables, and tahini.', 'prep' => 20, 'cook' => 30, 'cal' => 450, 'protein' => 24, 'carbs' => 48, 'fat' => 18, 'diet' => 'vegan', 'goal' => 'muscle-building', 'meal' => 'lunch', 'tags' => array('vegan', 'protein', 'complete')),
            array('name' => 'Mediterranean Fish Stew', 'desc' => 'White fish simmered with tomatoes, olives, and capers.', 'prep' => 15, 'cook' => 30, 'cal' => 320, 'protein' => 32, 'carbs' => 14, 'fat' => 16, 'diet' => 'mediterranean', 'goal' => 'heart-health', 'meal' => 'dinner', 'tags' => array('seafood', 'mediterranean', 'healthy')),
            array('name' => 'Whole30 Chicken Hash', 'desc' => 'Diced chicken with potatoes and vegetables, Whole30 compliant.', 'prep' => 15, 'cook' => 30, 'cal' => 380, 'protein' => 32, 'carbs' => 28, 'fat' => 16, 'diet' => 'whole30', 'goal' => 'energy-boost', 'meal' => 'breakfast', 'tags' => array('whole30', 'paleo', 'hearty')),
            array('name' => 'Gluten-Free Pasta Primavera', 'desc' => 'Rice pasta with seasonal vegetables and olive oil.', 'prep' => 15, 'cook' => 20, 'cal' => 420, 'protein' => 12, 'carbs' => 58, 'fat' => 16, 'diet' => 'gluten-free', 'goal' => '', 'meal' => 'dinner', 'tags' => array('gluten-free', 'italian', 'vegetables')),
            array('name' => 'Low-Cal Zoodle Bowl', 'desc' => 'Zucchini noodles with tomato sauce and vegetables.', 'prep' => 15, 'cook' => 10, 'cal' => 180, 'protein' => 8, 'carbs' => 22, 'fat' => 8, 'diet' => 'vegan', 'goal' => 'weight-loss', 'meal' => 'dinner', 'tags' => array('low-calorie', 'vegetables', 'light')),
            array('name' => 'High-Protein Tuna Salad', 'desc' => 'Chunky tuna salad with eggs and Greek yogurt dressing.', 'prep' => 15, 'cook' => 12, 'cal' => 320, 'protein' => 42, 'carbs' => 8, 'fat' => 14, 'diet' => '', 'goal' => 'muscle-building', 'meal' => 'lunch', 'tags' => array('protein', 'omega-3', 'filling')),
            array('name' => 'Gut-Healing Smoothie', 'desc' => 'Banana smoothie with kefir, ginger, and turmeric.', 'prep' => 5, 'cook' => 0, 'cal' => 220, 'protein' => 12, 'carbs' => 32, 'fat' => 6, 'diet' => 'vegetarian', 'goal' => 'gut-health', 'meal' => 'breakfast', 'tags' => array('probiotics', 'anti-inflammatory', 'smoothie')),
            array('name' => 'Heart-Healthy Oatmeal', 'desc' => 'Steel-cut oats with walnuts, berries, and flax seeds.', 'prep' => 5, 'cook' => 25, 'cal' => 380, 'protein' => 12, 'carbs' => 52, 'fat' => 16, 'diet' => 'vegan', 'goal' => 'heart-health', 'meal' => 'breakfast', 'tags' => array('fiber', 'omega-3', 'cholesterol-lowering')),
            array('name' => 'Veggie Egg Muffins', 'desc' => 'Portable egg cups with vegetables and cheese.', 'prep' => 15, 'cook' => 25, 'cal' => 140, 'protein' => 12, 'carbs' => 4, 'fat' => 9, 'diet' => 'keto', 'goal' => 'weight-loss', 'meal' => 'breakfast', 'tags' => array('meal-prep', 'portable', 'protein')),
            array('name' => 'Coconut Curry Lentils', 'desc' => 'Red lentils in creamy coconut curry sauce.', 'prep' => 10, 'cook' => 30, 'cal' => 380, 'protein' => 18, 'carbs' => 48, 'fat' => 14, 'diet' => 'vegan', 'goal' => 'gut-health', 'meal' => 'dinner', 'tags' => array('vegan', 'indian', 'fiber')),
            array('name' => 'Grilled Vegetable Platter', 'desc' => 'Assorted grilled vegetables with balsamic glaze.', 'prep' => 20, 'cook' => 15, 'cal' => 180, 'protein' => 6, 'carbs' => 24, 'fat' => 10, 'diet' => 'vegan', 'goal' => 'weight-loss', 'meal' => 'dinner', 'tags' => array('vegan', 'colorful', 'summer')),
            array('name' => 'Turkey Lettuce Cups', 'desc' => 'Seasoned ground turkey in crisp lettuce leaves.', 'prep' => 10, 'cook' => 15, 'cal' => 280, 'protein' => 28, 'carbs' => 12, 'fat' => 14, 'diet' => 'paleo', 'goal' => 'weight-loss', 'meal' => 'lunch', 'tags' => array('low-carb', 'protein', 'fresh')),
            array('name' => 'Sardine Toast', 'desc' => 'Mashed sardines on sourdough with lemon and herbs.', 'prep' => 10, 'cook' => 5, 'cal' => 320, 'protein' => 24, 'carbs' => 22, 'fat' => 16, 'diet' => 'mediterranean', 'goal' => 'heart-health', 'meal' => 'lunch', 'tags' => array('omega-3', 'calcium', 'affordable')),
        );
        
        $count = 0;
        foreach ($recipes as $recipe) {
            $meal_type = isset($recipe['meal']) ? $recipe['meal'] : 'snack';
            $is_breaking = isset($recipe['breaking']) && $recipe['breaking'];
            
            $data = $this->build_recipe_data($recipe, $meal_type, $is_breaking);
            $id = $this->manager->create_recipe($data);
            if ($id) $count++;
        }
        
        return $count;
    }
    
    private function insert_recipes($recipes, $meal_type, $some_breaking_fast = false) {
        $count = 0;
        
        foreach ($recipes as $index => $recipe) {
            // Mark some as breaking fast (first 3-4 of breakfast recipes)
            $is_breaking = $some_breaking_fast && $index < 4;
            
            $data = $this->build_recipe_data($recipe, $meal_type, $is_breaking);
            $id = $this->manager->create_recipe($data);
            if ($id) $count++;
        }
        
        return $count;
    }
    
    private function build_recipe_data($recipe, $meal_type, $is_breaking = false) {
        // Get random image for meal type
        $images = $this->images[$meal_type] ?? $this->images['lunch'];
        $image = $images[array_rand($images)];
        
        // Generate ingredients based on recipe type
        $ingredients = $this->generate_ingredients($recipe);
        
        // Generate instructions
        $instructions = $this->generate_instructions($recipe);
        
        return array(
            'name' => $recipe['name'],
            'description' => $recipe['desc'],
            'imageUrl' => $image,
            'prepTime' => $recipe['prep'],
            'cookTime' => $recipe['cook'],
            'servings' => rand(1, 4),
            'calories' => $recipe['cal'],
            'protein' => $recipe['protein'],
            'carbs' => $recipe['carbs'],
            'fat' => $recipe['fat'],
            'fiber' => rand(2, 8),
            'category' => $is_breaking ? 'breaking-fast' : 'regular',
            'mealType' => $meal_type,
            'dietType' => $recipe['diet'] ?: null,
            'goalType' => $recipe['goal'] ?: null,
            'tags' => $recipe['tags'],
            'difficulty' => $this->calculate_difficulty($recipe['prep'], $recipe['cook']),
            'isFeatured' => rand(0, 10) > 8, // 20% chance of being featured
            'isBreakingFast' => $is_breaking,
            'rating' => round(rand(40, 50) / 10, 1),
            'ingredients' => $ingredients,
            'instructions' => $instructions,
        );
    }
    
    private function calculate_difficulty($prep, $cook) {
        $total = $prep + $cook;
        if ($total <= 15) return 'easy';
        if ($total <= 45) return 'medium';
        return 'hard';
    }
    
    private function generate_ingredients($recipe) {
        // Base ingredients templates
        $protein_ingredients = array('chicken breast', 'salmon fillet', 'ground beef', 'tofu', 'eggs', 'shrimp', 'turkey');
        $vegetables = array('spinach', 'broccoli', 'bell peppers', 'onion', 'garlic', 'tomatoes', 'zucchini', 'carrots');
        $seasonings = array('salt', 'black pepper', 'olive oil', 'garlic powder', 'paprika', 'cumin', 'oregano');
        
        $ingredients = array();
        
        // Add protein based on calories
        if ($recipe['protein'] > 15) {
            $protein = $protein_ingredients[array_rand($protein_ingredients)];
            $amount = rand(150, 300);
            $ingredients[] = "{$amount}g {$protein}";
        }
        
        // Add vegetables
        $num_veggies = rand(2, 4);
        $selected_veggies = array_rand(array_flip($vegetables), $num_veggies);
        foreach ((array)$selected_veggies as $veg) {
            $amounts = array('1 cup', '1/2 cup', '2 cups', '100g');
            $ingredients[] = $amounts[array_rand($amounts)] . ' ' . $veg;
        }
        
        // Add seasonings
        $num_seasonings = rand(2, 4);
        $selected_seasonings = array_rand(array_flip($seasonings), $num_seasonings);
        foreach ((array)$selected_seasonings as $season) {
            if ($season === 'olive oil') {
                $ingredients[] = '2 tbsp olive oil';
            } else {
                $ingredients[] = ucfirst($season) . ' to taste';
            }
        }
        
        return $ingredients;
    }
    
    private function generate_instructions($recipe) {
        $instructions = array();
        
        // Prep step
        $instructions[] = 'Prepare all ingredients and gather your equipment.';
        
        if ($recipe['prep'] > 10) {
            $instructions[] = 'Chop vegetables and prepare any marinades.';
        }
        
        // Cooking steps based on cook time
        if ($recipe['cook'] > 0) {
            $cook_methods = array(
                'Heat oil in a pan over medium heat.',
                'Preheat oven to 375°F (190°C).',
                'Bring a pot of water to boil.',
                'Heat a grill or grill pan over high heat.'
            );
            $instructions[] = $cook_methods[array_rand($cook_methods)];
            
            $instructions[] = 'Add the main ingredients and cook according to recipe specifications.';
            
            if ($recipe['cook'] > 20) {
                $instructions[] = 'Continue cooking until golden brown and cooked through.';
            }
        }
        
        // Assembly step
        $instructions[] = 'Combine all components and adjust seasoning to taste.';
        
        // Serving step
        $instructions[] = 'Serve immediately and enjoy!';
        
        return $instructions;
    }
}



