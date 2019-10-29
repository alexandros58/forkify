import axios from 'axios';

export default class Search {
    constructor(query) {
        this.query = query;
    }

    async getResults() {
        const key = '1f6715f70c116e55ad01252054097bda';
        const proxy = `https://cors-anywhere.herokuapp.com/`
        try {
            const res = await axios(`${proxy}http://food2fork.com/api/search?key=${key}&q=${this.query}`);
            this.result = res.data.recipes;
            // console.log(this.result)
        } catch(error) {
            alert(error)
        }
        
    }
}