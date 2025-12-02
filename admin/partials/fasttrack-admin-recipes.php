<?php
/**
 * Admin Recipes Management Page
 *
 * @link       https://example.com
 * @since      2.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/admin/partials
 */

if (!defined('ABSPATH')) {
    exit;
}

$current_action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
?>

<div class="wrap fasttrack-admin-recipes">
    <h1 class="wp-heading-inline">
        <?php if ($current_action === 'add'): ?>
            <?php _e('Add New Recipe', 'fasttrack'); ?>
        <?php elseif ($current_action === 'edit'): ?>
            <?php _e('Edit Recipe', 'fasttrack'); ?>
        <?php else: ?>
            <?php _e('FastTrack Recipes', 'fasttrack'); ?>
        <?php endif; ?>
    </h1>
    
    <?php if ($current_action === 'list'): ?>
        <a href="<?php echo admin_url('admin.php?page=fasttrack-recipes&action=add'); ?>" class="page-title-action">
            <?php _e('Add New', 'fasttrack'); ?>
        </a>
    <?php else: ?>
        <a href="<?php echo admin_url('admin.php?page=fasttrack-recipes'); ?>" class="page-title-action">
            <?php _e('Back to List', 'fasttrack'); ?>
        </a>
    <?php endif; ?>
    
    <hr class="wp-header-end">
    
    <!-- Notices -->
    <?php if (isset($_GET['created'])): ?>
        <div class="notice notice-success is-dismissible">
            <p><?php _e('Recipe created successfully!', 'fasttrack'); ?></p>
        </div>
    <?php endif; ?>
    
    <?php if (isset($_GET['updated'])): ?>
        <div class="notice notice-success is-dismissible">
            <p><?php _e('Recipe updated successfully!', 'fasttrack'); ?></p>
        </div>
    <?php endif; ?>
    
    <?php if (isset($_GET['deleted'])): ?>
        <div class="notice notice-success is-dismissible">
            <p><?php _e('Recipe deleted successfully!', 'fasttrack'); ?></p>
        </div>
    <?php endif; ?>
    
    <?php if (isset($_GET['imported'])): ?>
        <div class="notice notice-success is-dismissible">
            <p><?php printf(__('Imported %d recipes successfully! (%d failed)', 'fasttrack'), intval($_GET['imported']), intval($_GET['failed'] ?? 0)); ?></p>
        </div>
    <?php endif; ?>
    
    <?php if (isset($_GET['seeded'])): ?>
        <div class="notice notice-success is-dismissible">
            <p><?php printf(__('Seeded %d default recipes successfully!', 'fasttrack'), intval($_GET['seeded'])); ?></p>
        </div>
    <?php endif; ?>
    
    <?php if (isset($_GET['error'])): ?>
        <div class="notice notice-error is-dismissible">
            <p><?php _e('There was an error processing your request.', 'fasttrack'); ?></p>
        </div>
    <?php endif; ?>
    
    <?php if ($current_action === 'list'): ?>
        <!-- Statistics Cards -->
        <div class="fasttrack-stats-cards" style="display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap;">
            <div class="fasttrack-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 150px;">
                <div style="font-size: 32px; font-weight: bold; color: #3498db;"><?php echo number_format($stats['total'] ?? 0); ?></div>
                <div style="color: #666; margin-top: 5px;"><?php _e('Total Recipes', 'fasttrack'); ?></div>
            </div>
            <div class="fasttrack-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 150px;">
                <div style="font-size: 32px; font-weight: bold; color: #f39c12;"><?php echo number_format($stats['featured_count'] ?? 0); ?></div>
                <div style="color: #666; margin-top: 5px;"><?php _e('Featured', 'fasttrack'); ?></div>
            </div>
            <div class="fasttrack-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 150px;">
                <div style="font-size: 32px; font-weight: bold; color: #27ae60;"><?php echo number_format($stats['breaking_fast_count'] ?? 0); ?></div>
                <div style="color: #666; margin-top: 5px;"><?php _e('Breaking Fast', 'fasttrack'); ?></div>
            </div>
        </div>
        
        <!-- Bulk Actions -->
        <div class="fasttrack-bulk-actions" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="margin-top: 0;"><?php _e('Bulk Actions', 'fasttrack'); ?></h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <!-- Seed Default Recipes -->
                <form method="post" style="display: inline-block;">
                    <?php wp_nonce_field('fasttrack_save_recipe', 'fasttrack_recipe_nonce'); ?>
                    <input type="hidden" name="recipe_action" value="seed_recipes">
                    <button type="submit" class="button button-primary" onclick="return confirm('<?php _e('This will add 100+ default recipes. Continue?', 'fasttrack'); ?>');">
                        <?php _e('🌱 Seed Default Recipes (100+)', 'fasttrack'); ?>
                    </button>
                </form>
                
                <!-- Import JSON -->
                <form method="post" enctype="multipart/form-data" style="display: inline-flex; align-items: center; gap: 10px;">
                    <?php wp_nonce_field('fasttrack_save_recipe', 'fasttrack_recipe_nonce'); ?>
                    <input type="hidden" name="recipe_action" value="import_json">
                    <input type="file" name="import_file" accept=".json" required style="max-width: 200px;">
                    <button type="submit" class="button">
                        <?php _e('📥 Import JSON', 'fasttrack'); ?>
                    </button>
                </form>
            </div>
        </div>
        
        <!-- Filters -->
        <div class="tablenav top">
            <form method="get" style="display: flex; gap: 10px; align-items: center;">
                <input type="hidden" name="page" value="fasttrack-recipes">
                
                <select name="meal_type">
                    <option value=""><?php _e('All Meal Types', 'fasttrack'); ?></option>
                    <option value="breakfast" <?php selected($_GET['meal_type'] ?? '', 'breakfast'); ?>><?php _e('Breakfast', 'fasttrack'); ?></option>
                    <option value="lunch" <?php selected($_GET['meal_type'] ?? '', 'lunch'); ?>><?php _e('Lunch', 'fasttrack'); ?></option>
                    <option value="dinner" <?php selected($_GET['meal_type'] ?? '', 'dinner'); ?>><?php _e('Dinner', 'fasttrack'); ?></option>
                    <option value="snack" <?php selected($_GET['meal_type'] ?? '', 'snack'); ?>><?php _e('Snacks', 'fasttrack'); ?></option>
                </select>
                
                <select name="diet_type">
                    <option value=""><?php _e('All Diet Types', 'fasttrack'); ?></option>
                    <option value="keto" <?php selected($_GET['diet_type'] ?? '', 'keto'); ?>><?php _e('Keto', 'fasttrack'); ?></option>
                    <option value="paleo" <?php selected($_GET['diet_type'] ?? '', 'paleo'); ?>><?php _e('Paleo', 'fasttrack'); ?></option>
                    <option value="vegan" <?php selected($_GET['diet_type'] ?? '', 'vegan'); ?>><?php _e('Vegan', 'fasttrack'); ?></option>
                    <option value="vegetarian" <?php selected($_GET['diet_type'] ?? '', 'vegetarian'); ?>><?php _e('Vegetarian', 'fasttrack'); ?></option>
                    <option value="mediterranean" <?php selected($_GET['diet_type'] ?? '', 'mediterranean'); ?>><?php _e('Mediterranean', 'fasttrack'); ?></option>
                </select>
                
                <input type="search" name="search" value="<?php echo esc_attr($_GET['search'] ?? ''); ?>" placeholder="<?php _e('Search recipes...', 'fasttrack'); ?>">
                
                <button type="submit" class="button"><?php _e('Filter', 'fasttrack'); ?></button>
                <a href="<?php echo admin_url('admin.php?page=fasttrack-recipes'); ?>" class="button"><?php _e('Reset', 'fasttrack'); ?></a>
            </form>
        </div>
        
        <!-- Recipes Table -->
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 60px;"><?php _e('Image', 'fasttrack'); ?></th>
                    <th><?php _e('Name', 'fasttrack'); ?></th>
                    <th><?php _e('Category', 'fasttrack'); ?></th>
                    <th><?php _e('Meal Type', 'fasttrack'); ?></th>
                    <th><?php _e('Diet Type', 'fasttrack'); ?></th>
                    <th><?php _e('Calories', 'fasttrack'); ?></th>
                    <th><?php _e('Time', 'fasttrack'); ?></th>
                    <th><?php _e('Rating', 'fasttrack'); ?></th>
                    <th><?php _e('Actions', 'fasttrack'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($recipes)): ?>
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">🍽️</div>
                            <p style="color: #666;"><?php _e('No recipes found. Add your first recipe or seed default recipes!', 'fasttrack'); ?></p>
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($recipes as $r): ?>
                        <tr>
                            <td>
                                <?php if (!empty($r['imageUrl'])): ?>
                                    <img src="<?php echo esc_url($r['imageUrl']); ?>" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                                <?php else: ?>
                                    <div style="width: 50px; height: 50px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🍴</div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <strong><a href="<?php echo admin_url('admin.php?page=fasttrack-recipes&action=edit&recipe_id=' . $r['id']); ?>"><?php echo esc_html($r['name']); ?></a></strong>
                                <?php if (!empty($r['isFeatured'])): ?>
                                    <span style="background: #f39c12; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px;">⭐ Featured</span>
                                <?php endif; ?>
                                <?php if (!empty($r['isBreakingFast'])): ?>
                                    <span style="background: #27ae60; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px;">🌅 Breaking Fast</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo esc_html($r['category'] ?? '-'); ?></td>
                            <td>
                                <?php if (!empty($r['mealType'])): ?>
                                    <span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 11px;"><?php echo esc_html(ucfirst($r['mealType'])); ?></span>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($r['dietType'])): ?>
                                    <span style="background: #e8f5e9; color: #388e3c; padding: 2px 8px; border-radius: 12px; font-size: 11px;"><?php echo esc_html(ucfirst($r['dietType'])); ?></span>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </td>
                            <td><?php echo number_format($r['calories']); ?> kcal</td>
                            <td><?php echo intval($r['prepTime']) + intval($r['cookTime']); ?> min</td>
                            <td>
                                <span style="color: #f39c12;">★</span> <?php echo number_format($r['rating'], 1); ?>
                            </td>
                            <td>
                                <a href="<?php echo admin_url('admin.php?page=fasttrack-recipes&action=edit&recipe_id=' . $r['id']); ?>" class="button button-small"><?php _e('Edit', 'fasttrack'); ?></a>
                                <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=fasttrack-recipes&action=delete&recipe_id=' . $r['id']), 'delete_recipe_' . $r['id']); ?>" class="button button-small" style="color: #dc3545;" onclick="return confirm('<?php _e('Are you sure you want to delete this recipe?', 'fasttrack'); ?>');"><?php _e('Delete', 'fasttrack'); ?></a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
        
        <!-- Pagination -->
        <?php if (isset($total_pages) && $total_pages > 1): ?>
            <div class="tablenav bottom">
                <div class="tablenav-pages">
                    <?php
                    $page_links = paginate_links(array(
                        'base' => add_query_arg('paged', '%#%'),
                        'format' => '',
                        'prev_text' => __('&laquo;'),
                        'next_text' => __('&raquo;'),
                        'total' => $total_pages,
                        'current' => $page ?? 1
                    ));
                    echo $page_links;
                    ?>
                </div>
            </div>
        <?php endif; ?>
        
    <?php else: ?>
        <!-- Add/Edit Recipe Form -->
        <form method="post" enctype="multipart/form-data" class="fasttrack-recipe-form" style="max-width: 900px;">
            <?php wp_nonce_field('fasttrack_save_recipe', 'fasttrack_recipe_nonce'); ?>
            <input type="hidden" name="recipe_action" value="save">
            <?php if (!empty($recipe['id'])): ?>
                <input type="hidden" name="recipe_id" value="<?php echo intval($recipe['id']); ?>">
            <?php endif; ?>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- Left Column -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Basic Info -->
                    <div class="postbox">
                        <h2 class="hndle" style="padding: 10px 15px; margin: 0;"><?php _e('Basic Information', 'fasttrack'); ?></h2>
                        <div class="inside" style="padding: 15px;">
                            <p>
                                <label for="title"><strong><?php _e('Recipe Name', 'fasttrack'); ?></strong></label><br>
                                <input type="text" id="title" name="title" value="<?php echo esc_attr($recipe['name'] ?? ''); ?>" required style="width: 100%;">
                            </p>
                            <p>
                                <label for="description"><strong><?php _e('Description', 'fasttrack'); ?></strong></label><br>
                                <textarea id="description" name="description" rows="3" style="width: 100%;"><?php echo esc_textarea($recipe['description'] ?? ''); ?></textarea>
                            </p>
                            <p>
                                <label for="image_url"><strong><?php _e('Image URL', 'fasttrack'); ?></strong></label><br>
                                <input type="url" id="image_url" name="image_url" value="<?php echo esc_url($recipe['imageUrl'] ?? ''); ?>" style="width: 100%;">
                            </p>
                            <p>
                                <label for="recipe_image"><strong><?php _e('Or Upload Image', 'fasttrack'); ?></strong></label><br>
                                <input type="file" id="recipe_image" name="recipe_image" accept="image/*">
                            </p>
                        </div>
                    </div>
                    
                    <!-- Categories -->
                    <div class="postbox">
                        <h2 class="hndle" style="padding: 10px 15px; margin: 0;"><?php _e('Categories', 'fasttrack'); ?></h2>
                        <div class="inside" style="padding: 15px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <p>
                                    <label for="meal_type"><strong><?php _e('Meal Type', 'fasttrack'); ?></strong></label><br>
                                    <select id="meal_type" name="meal_type" style="width: 100%;">
                                        <option value=""><?php _e('Select...', 'fasttrack'); ?></option>
                                        <option value="breakfast" <?php selected($recipe['mealType'] ?? '', 'breakfast'); ?>><?php _e('Breakfast', 'fasttrack'); ?></option>
                                        <option value="lunch" <?php selected($recipe['mealType'] ?? '', 'lunch'); ?>><?php _e('Lunch', 'fasttrack'); ?></option>
                                        <option value="dinner" <?php selected($recipe['mealType'] ?? '', 'dinner'); ?>><?php _e('Dinner', 'fasttrack'); ?></option>
                                        <option value="snack" <?php selected($recipe['mealType'] ?? '', 'snack'); ?>><?php _e('Snacks', 'fasttrack'); ?></option>
                                    </select>
                                </p>
                                <p>
                                    <label for="diet_type"><strong><?php _e('Diet Type', 'fasttrack'); ?></strong></label><br>
                                    <select id="diet_type" name="diet_type" style="width: 100%;">
                                        <option value=""><?php _e('Select...', 'fasttrack'); ?></option>
                                        <option value="keto" <?php selected($recipe['dietType'] ?? '', 'keto'); ?>><?php _e('Keto', 'fasttrack'); ?></option>
                                        <option value="paleo" <?php selected($recipe['dietType'] ?? '', 'paleo'); ?>><?php _e('Paleo', 'fasttrack'); ?></option>
                                        <option value="vegan" <?php selected($recipe['dietType'] ?? '', 'vegan'); ?>><?php _e('Vegan', 'fasttrack'); ?></option>
                                        <option value="vegetarian" <?php selected($recipe['dietType'] ?? '', 'vegetarian'); ?>><?php _e('Vegetarian', 'fasttrack'); ?></option>
                                        <option value="mediterranean" <?php selected($recipe['dietType'] ?? '', 'mediterranean'); ?>><?php _e('Mediterranean', 'fasttrack'); ?></option>
                                        <option value="whole30" <?php selected($recipe['dietType'] ?? '', 'whole30'); ?>><?php _e('Whole30', 'fasttrack'); ?></option>
                                        <option value="gluten-free" <?php selected($recipe['dietType'] ?? '', 'gluten-free'); ?>><?php _e('Gluten-Free', 'fasttrack'); ?></option>
                                    </select>
                                </p>
                                <p>
                                    <label for="goal_type"><strong><?php _e('Goal Type', 'fasttrack'); ?></strong></label><br>
                                    <select id="goal_type" name="goal_type" style="width: 100%;">
                                        <option value=""><?php _e('Select...', 'fasttrack'); ?></option>
                                        <option value="weight-loss" <?php selected($recipe['goalType'] ?? '', 'weight-loss'); ?>><?php _e('Weight Loss', 'fasttrack'); ?></option>
                                        <option value="muscle-building" <?php selected($recipe['goalType'] ?? '', 'muscle-building'); ?>><?php _e('Muscle Building', 'fasttrack'); ?></option>
                                        <option value="energy-boost" <?php selected($recipe['goalType'] ?? '', 'energy-boost'); ?>><?php _e('Energy Boost', 'fasttrack'); ?></option>
                                        <option value="gut-health" <?php selected($recipe['goalType'] ?? '', 'gut-health'); ?>><?php _e('Gut Health', 'fasttrack'); ?></option>
                                        <option value="heart-health" <?php selected($recipe['goalType'] ?? '', 'heart-health'); ?>><?php _e('Heart Health', 'fasttrack'); ?></option>
                                    </select>
                                </p>
                                <p>
                                    <label for="difficulty"><strong><?php _e('Difficulty', 'fasttrack'); ?></strong></label><br>
                                    <select id="difficulty" name="difficulty" style="width: 100%;">
                                        <option value="easy" <?php selected($recipe['difficulty'] ?? '', 'easy'); ?>><?php _e('Easy', 'fasttrack'); ?></option>
                                        <option value="medium" <?php selected($recipe['difficulty'] ?? 'medium', 'medium'); ?>><?php _e('Medium', 'fasttrack'); ?></option>
                                        <option value="hard" <?php selected($recipe['difficulty'] ?? '', 'hard'); ?>><?php _e('Hard', 'fasttrack'); ?></option>
                                    </select>
                                </p>
                            </div>
                            <p>
                                <label for="tags"><strong><?php _e('Tags (comma-separated)', 'fasttrack'); ?></strong></label><br>
                                <input type="text" id="tags" name="tags" value="<?php echo esc_attr(implode(', ', $recipe['tags'] ?? array())); ?>" style="width: 100%;" placeholder="keto, high-protein, quick">
                            </p>
                            <p style="display: flex; gap: 20px;">
                                <label>
                                    <input type="checkbox" name="is_featured" value="1" <?php checked(!empty($recipe['isFeatured'])); ?>>
                                    <?php _e('Featured Recipe', 'fasttrack'); ?>
                                </label>
                                <label>
                                    <input type="checkbox" name="is_breaking_fast" value="1" <?php checked(!empty($recipe['isBreakingFast'])); ?>>
                                    <?php _e('Good for Breaking Fast', 'fasttrack'); ?>
                                </label>
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Time & Servings -->
                    <div class="postbox">
                        <h2 class="hndle" style="padding: 10px 15px; margin: 0;"><?php _e('Time & Servings', 'fasttrack'); ?></h2>
                        <div class="inside" style="padding: 15px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <p>
                                    <label for="prep_time"><strong><?php _e('Prep Time (min)', 'fasttrack'); ?></strong></label><br>
                                    <input type="number" id="prep_time" name="prep_time" value="<?php echo intval($recipe['prepTime'] ?? 0); ?>" min="0" style="width: 100%;">
                                </p>
                                <p>
                                    <label for="cook_time"><strong><?php _e('Cook Time (min)', 'fasttrack'); ?></strong></label><br>
                                    <input type="number" id="cook_time" name="cook_time" value="<?php echo intval($recipe['cookTime'] ?? 0); ?>" min="0" style="width: 100%;">
                                </p>
                                <p>
                                    <label for="servings"><strong><?php _e('Servings', 'fasttrack'); ?></strong></label><br>
                                    <input type="number" id="servings" name="servings" value="<?php echo intval($recipe['servings'] ?? 1); ?>" min="1" style="width: 100%;">
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Nutrition -->
                    <div class="postbox">
                        <h2 class="hndle" style="padding: 10px 15px; margin: 0;"><?php _e('Nutrition (per serving)', 'fasttrack'); ?></h2>
                        <div class="inside" style="padding: 15px;">
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                                <p>
                                    <label for="calories"><strong><?php _e('Calories', 'fasttrack'); ?></strong></label><br>
                                    <input type="number" id="calories" name="calories" value="<?php echo intval($recipe['calories'] ?? 0); ?>" min="0" style="width: 100%;">
                                </p>
                                <p>
                                    <label for="protein"><strong><?php _e('Protein (g)', 'fasttrack'); ?></strong></label><br>
                                    <input type="number" id="protein" name="protein" value="<?php echo floatval($recipe['protein'] ?? 0); ?>" min="0" step="0.1" style="width: 100%;">
                                </p>
                                <p>
                                    <label for="carbs"><strong><?php _e('Carbs (g)', 'fasttrack'); ?></strong></label><br>
                                    <input type="number" id="carbs" name="carbs" value="<?php echo floatval($recipe['carbs'] ?? 0); ?>" min="0" step="0.1" style="width: 100%;">
                                </p>
                                <p>
                                    <label for="fat"><strong><?php _e('Fat (g)', 'fasttrack'); ?></strong></label><br>
                                    <input type="number" id="fat" name="fat" value="<?php echo floatval($recipe['fat'] ?? 0); ?>" min="0" step="0.1" style="width: 100%;">
                                </p>
                                <p>
                                    <label for="fiber"><strong><?php _e('Fiber (g)', 'fasttrack'); ?></strong></label><br>
                                    <input type="number" id="fiber" name="fiber" value="<?php echo floatval($recipe['fiber'] ?? 0); ?>" min="0" step="0.1" style="width: 100%;">
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ingredients -->
                    <div class="postbox">
                        <h2 class="hndle" style="padding: 10px 15px; margin: 0;"><?php _e('Ingredients (one per line)', 'fasttrack'); ?></h2>
                        <div class="inside" style="padding: 15px;">
                            <textarea id="ingredients" name="ingredients" rows="8" style="width: 100%;" placeholder="200g chicken breast&#10;1 tbsp olive oil&#10;Salt and pepper to taste"><?php echo esc_textarea(implode("\n", $recipe['ingredients'] ?? array())); ?></textarea>
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div class="postbox">
                        <h2 class="hndle" style="padding: 10px 15px; margin: 0;"><?php _e('Instructions (one step per line)', 'fasttrack'); ?></h2>
                        <div class="inside" style="padding: 15px;">
                            <textarea id="instructions" name="instructions" rows="8" style="width: 100%;" placeholder="Preheat oven to 180°C&#10;Season the chicken with salt and pepper&#10;Bake for 25-30 minutes"><?php echo esc_textarea(implode("\n", $recipe['instructions'] ?? array())); ?></textarea>
                        </div>
                    </div>
                </div>
            </div>
            
            <p class="submit" style="margin-top: 20px;">
                <button type="submit" class="button button-primary button-large"><?php _e('Save Recipe', 'fasttrack'); ?></button>
                <a href="<?php echo admin_url('admin.php?page=fasttrack-recipes'); ?>" class="button button-large"><?php _e('Cancel', 'fasttrack'); ?></a>
            </p>
        </form>
    <?php endif; ?>
</div>

<style>
.fasttrack-admin-recipes .postbox {
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
}
.fasttrack-admin-recipes .postbox .hndle {
    border-bottom: 1px solid #c3c4c7;
    background: #f6f7f7;
}
.fasttrack-admin-recipes input[type="text"],
.fasttrack-admin-recipes input[type="url"],
.fasttrack-admin-recipes input[type="number"],
.fasttrack-admin-recipes select,
.fasttrack-admin-recipes textarea {
    border-radius: 4px;
}
</style>



