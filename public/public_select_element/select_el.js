/* ==============================================
    CUSTOM SELECT
  ============================================== */
  const sorting = document.querySelector('.selectpicker');
  const commentSorting = document.querySelector('.selectpicker');
  const sortingchoices = new Choices(sorting, {
	  placeholder: false,
	  itemSelectText: ''
  });
  
  
  // Trick to apply your custom classes to generated dropdown menu
  let sortingClass = sorting.getAttribute('class');
  window.onload= function () {
	  sorting.parentElement.setAttribute('class', sortingClass);
  }