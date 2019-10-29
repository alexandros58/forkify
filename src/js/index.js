// Global app controller
import Search from './models/Search';
import Recipe from './models/recipes';
import List from './models/List';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as ListView from './views/ListView';
import * as LikesView from './views/LikesView';
import { elements, renderLoader, clearLoader } from './views/base';
import Likes from './models/likes';

/* GLOBAL STATE OF THE APP
-- SEARCH OBJECT
-- CURRENT RECIPE OBJECT
-- SHOPPING LIST OBJECT
-- LIKED RECIPES
*/

const state = {};
window.state = state;

/*----------------------------------------------
-------------- SEARCH CONTROLLER ---------------
-----------------------------------------------*/

const controlSearch = async () => {
    // 1) Get query from the view
    const query = searchView.getInput();

    if (query) {
        // 2) New search object and add it to state
        state.search = new Search(query);

        // 3) Prepare UI for the results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        
        try {
            // 4) Search for recipes
            await state.search.getResults();
    
            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result)
        } catch(err) {
            console.log(err);
            clearLoader();
        }
    }
    
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searcResPages.addEventListener('click', e => {
   const btn = e.target.closest('.btn-inline')
   if (btn) {
       const goToPage = parseInt(btn.dataset.goto);
       searchView.clearResults();
       searchView.renderResults(state.search.result, goToPage)
   }
})

/*----------------------------------------------
-------------- RECIPES CONTROLLER ---------------
-----------------------------------------------*/

const controlRecipe = async () => {
    // Get the id from the URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        // PREPARE THE UI FOR CHANGES
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // HIGHLIGHT SELECTED
        if (state.search) searchView.highlightSelected(id);

        // CREATE A NEW RECIPE OBJECT
        state.recipe = new Recipe(id);
        
        try {
            // GET RECIPE DATA 
            await state.recipe.getRecipe();
    
            // CALC SERVINGS AND TIME
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // RENDER THE RECIPE
            clearLoader();
            state.recipe.parseIngredients();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );
        } catch(error) {
            console.log(error);
        }
    }
};

['load', 'hashchange'].forEach(event => window.addEventListener(event, controlRecipe))

/*----------------------------------------------
-------------- LIST CONTROLLER ---------------
-----------------------------------------------*/

const controlList = () => {
    // CREATE A NEW LIST IF THERE IS NONE YET
    if (!state.list) state.list = new List();

    // ADD EACH INGREDIENT IN THE LIST
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        ListView.renderItem(item);
    })
}

/*----------------------------------------------
-------------- LIKES CONTROLLER ---------------
-----------------------------------------------*/

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currID = state.recipe.id;

    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // Toggle the like button
        LikesView.toggleLikeBtn(true);

        // Add the like to the UI likes list
        LikesView.renderLike(newLike);

    } else {
        // Remove like from the state
        state.likes.deleteLike(currID);

        // Toggle the like button
        LikesView.toggleLikeBtn(false);

        // Remove the like from the UI likes list
        LikesView.deleteLike(currID);
    }
    LikesView.toggleLikeMenu(state.likes.getNumLikes());
}


// HANDLING DELETE AND UPDATE LIST ITEMS EVENTS

elements.shoppingList.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handling the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        ListView.deleteItem(id);
    // Handling the update count    
    } else if (e.target.matches('.shopping__count--value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
})


// Restore likes recipes on page load

window.addEventListener('load', () => {
    state.likes = new Likes();

    state.likes.readStorage();

    LikesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => LikesView.renderLike(like));
})


// HANDLING RECIPE BUTTON CLICKS

elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *' )) {
        // Decrease btn is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec'); 
            recipeView.updateServsIngs(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *' )) {
        // Increase btn is clicked
        state.recipe.updateServings('inc'); 
        recipeView.updateServsIngs(state.recipe);
        // Shopping List
    } else if (e.target.matches('.recipe__btn-add, .recipe__btn-add *' )) {
        controlList();
        // Likes list
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }

})