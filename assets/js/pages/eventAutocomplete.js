import * as env from '../../env.js';

const eventAutocomplete = {
  input: document.querySelector('input[list="eventAutocompleteList"]'),
  datalist: document.getElementById('eventAutocompleteList')
}

eventAutocomplete.input.addEventListener('keyup', (event) => {
  event.preventDefault();
  const submitButton = document.querySelector('button.autocomplete[type="submit"]');
  const loadingButton = document.querySelector('button.autocomplete[type="button"]');
  if (event.target.value.length % 3 === 0) {
    submitButton.classList.add('d-none');
    loadingButton.classList.remove('d-none');
    fetch(`${env.API_SCHEME}://${env.API_HOST}:${env.API_PORT}/${env.API_VERSION}/autocomplete/event`, {
      method: 'POST',
      headers: {
        'X-Api-Key': `${env.API_KEY}`
      },
      body: JSON.stringify({
        Event: event.target.value
      })
    })
    .then(res => res.json())
    .then(res => {
      eventAutocomplete.datalist.replaceChildren();
      res.forEach(item => {
        const option = document.createElement('option');
        option.appendChild(document.createTextNode(item));
        option.addEventListener('click', (event) => {
          event.preventDefault();
          eventAutocomplete.input.value = item;
        });
        eventAutocomplete.datalist.append(option);
      });
    })
    .catch(error => {
      // TODO
    })
    .finally(() => {
      submitButton.classList.remove('d-none');
      loadingButton.classList.add('d-none');
    });
  }
});

export default eventAutocomplete;
