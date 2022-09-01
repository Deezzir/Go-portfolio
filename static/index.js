// var fields = {}; // dict with contact form fields

// // Main
// document.addEventListener("DOMContentLoaded", function () {
//     // Get contact form fields
//     fields.msg = document.querySelector('.message');
//     fields.email = document.querySelector('.email');
//     fields.firstName = document.querySelector('.first-name');
//     fields.lastName = document.querySelector('.last-name');

//     // //download CV button
//     // fields.download = document.querySelector('#download')

//     // Onfocus change validation
//     document.querySelector('.last-name').addEventListener('blur', () => { fieldValidation(fields.lastName, isNotEmpty); })
//     document.querySelector('.first-name').addEventListener('blur', () => { fieldValidation(fields.firstName, isNotEmpty); })
//     document.querySelector('.message').addEventListener('blur', () => { fieldValidation(fields.msg, isNotEmpty); })
//     document.querySelector('.email').addEventListener('blur', () => { fieldValidation(fields.email, isEmail); })

//     // Handle contact form button
//     document.querySelector('.contact-btn').addEventListener('click', fetchContact);
// });

// // const projectContainer = document.querySelector('.project-container');
// // projects.forEach(project => {
// //     projectContainer.innerHTML += `
// //     <div class="project-card" data-tags="#all, ${project.tags}">
// //         <img src="img/${project.image}" alt="">
// //         <div class="content">
// //             <h1 class="project-name">${project.name}</h1>
// //             <span class="tags">${project.tags}</span>
// //         </div>
// //     </div>
// //     `;
// // })

// function fetchContact() {
//     if (isValid()) {
//         fetch('/contact', {
//             method: 'post',
//             headers: new Headers({ 'Content-Type': 'application/json' }),
//             body: JSON.stringify({
//                 firstname: fields.firstName.value,
//                 lastname: fields.lastName.value,
//                 email: fields.email.value,
//                 msg: fields.msg.value,
//             })
//         })
//             .then(res => res.json())
//             .then(data => {
//                 console.log(data)
//             })
//     }
// }

// // Email validation
// function isEmail(email) {
//     let regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
//     return regex.test(String(email).toLowerCase());
// }

// // General Field validation
// function isNotEmpty(value) {
//     if (value == null || typeof value == 'undefined') return false;
//     return (value.length > 0);
// }

// // Function to validate given field with a given function validator
// function fieldValidation(field, validationFunction) {
//     if (field == null) return false;
//     let error = document.getElementById(field.className);

//     let isFieldValid = validationFunction(field.value)
//     if (!isFieldValid) {
//         if (error.classList.contains('hidden')) {
//             error.classList.remove('hidden');
//             setTimeout(function () {
//                 error.classList.remove('visuallyhidden');
//             }, 20);
//         }
//     } else {
//         if (!error.classList.contains('hidden')) {
//             error.classList.add('visuallyhidden');
//             error.addEventListener('transitionend', function (e) {
//                 error.classList.add('hidden');
//             }, {
//                 capture: false,
//                 once: true,
//                 passive: false
//             });
//         }
//     }

//     return isFieldValid;
// }

// // Validate all fields
// function isValid() {
//     var valid = true;

//     valid &= fieldValidation(fields.lastName, isNotEmpty);;
//     valid &= fieldValidation(fields.firstName, isNotEmpty);;
//     valid &= fieldValidation(fields.msg, isNotEmpty);;
//     valid &= fieldValidation(fields.email, isEmail);

//     return valid;
// }
