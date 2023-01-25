//Declaration of the many global variables used

const authorInputForm = document.getElementById("JS-Form");
const updateAuthorForm = document.getElementById("Update-Form");
const submitBtn = document.getElementById("submitbtn");
const resetBtn = document.getElementById("resetbtn");
const table = document.querySelector("table");
const tableBody = document.getElementById("TableBody");
const updateButton = document.getElementById("update-btn");
const submitModal = document.getElementById("submitModal");
const submitButton = document.getElementById("submitBtn");
const submitSpan = document.getElementsByClassName("closeSubmitModal")[0];
const updateModal = document.getElementById("updateModal");
const updateBtn = document.getElementById("updateBtn");
const updateSpan = document.getElementsByClassName("closeUpdate")[0];
const authorDiv = document.getElementById("AuthorDiv");
const searchBoxFilter = document.getElementById("searchBoxFilter");
var isFiltered = true;

//Function to retrieve the data in the data server, and upload it into the HTML document.
function getAuthorData() {
    fetch("https://wt.ops.labs.vu.nl/api23/1f8b2c5d")
        .then(response => response.json())
        .then(objectData => {
            tableBody.innerHTML = "";
            let authorArr = removeDuplicates(objectData);
            let authorNames = getAuthorNameArr(objectData);
            postAuthorName(authorNames);
            authorArr.forEach(element => {
                let markup = `<tr id = "${element.id}">
          <td><img src="${element.image}"></td>
          <td>${element.alt}</td>
          <td>${element.tags}</td>
          <td>${element.description}</td>
        </tr>`;
                tableBody.insertAdjacentHTML('beforeend', markup)
            });
        }).catch(error => {
            console.log(error);
        });

}

//Function to remove duplicate authors in the table
function removeDuplicates(objectData) {
    const noDup = [];

    for (let i = 0; i < objectData.length; i++) {
        dup = false;
        for (let j = 0; j < i; j++) {
            if (objectData[i].author == objectData[j].author) {
                dup = true;
            }
        }
        if (dup != true) {
            noDup.push(objectData[i]);

        }
    }
    return noDup;
}

//Function to create an array of author names only
function getAuthorNameArr(objectData) {

    var newAuthorArr = removeDuplicates(objectData);
    var authorNameArr = [];

    for (let i = 0; i < newAuthorArr.length; i++) {

        authorNameArr.push(newAuthorArr[i].author);

    }

    return authorNameArr;

}

//Function to make buttons of the authors names, used for filtration
function postAuthorName(authorNameArray) {

    authorDiv.innerHTML = "";
    var header2 = document.createElement("h2");
    header2.className = "authorHeader";
    header2.innerHTML = "Author Filtration List"
    authorDiv.appendChild(header2);

    authorNameArray.forEach(author => {

        let markup = `
        <button id = "${author}" class = "authorButtons">${author}</button>
        <br>
        `;
        authorDiv.insertAdjacentHTML('beforeend', markup)

    })
}

//Function to reset all of the data in the table
function resetData() {
    fetch("https://wt.ops.labs.vu.nl/api23/1f8b2c5d/reset")
        .then(() => {
            getAuthorData()
        }).catch(error => {
            console.log(error);
        });
}

//Function to update an author's information inside the database
function updateAuthor(authorID) {

    const authorForm = new FormData(updateAuthorForm);
    const authorDataObj = Object.fromEntries(authorForm);

    fetch("https://wt.ops.labs.vu.nl/api23/1f8b2c5d/item/" + authorID, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(authorDataObj)
    }).then(() => getAuthorData())

}
//Function used to make every row the same length as the DIV/table
function equalRowLengths() {

    let cells = table.getElementsByTagName("td");

    for (let i = 0; i < cells.length; i++) {

        cells[i].style.width = "100%";

    }

    table.style.width = "100%";
}

var lastAuthor = "";
//Function used to filter the table accroding to the selected author names.
function filterTable(event) {

    /*This code came about through the inspiration of the following link: https://www.aspsnippets.com/questions/382690/Filter-Search-HTML-Table-based-on-TextBox-value-on-Button-Click-in-JavaScript/
    We used this that code a a guideline and adjusted as we went along. */

    equalRowLengths();
    let authorName = event.target.textContent.trim();
    let buttonID = document.getElementById(event.target.id);

    let allButtons = authorDiv.getElementsByClassName("authorButtons");

    for (let k = 0; k < allButtons.length; k++) {
        allButtons[k].style.backgroundColor = "#FAF9F6";
    }

    buttonID.style.backgroundColor = "gray";
    tableBody.innerHTML = "";

    if (authorName === lastAuthor) {
        getAuthorData();
        lastAuthor = "";
    } else {
        fetch("https://wt.ops.labs.vu.nl/api23/1f8b2c5d")
            .then(response => response.json())
            .then(objectData => {
                for (let i = 0; i < objectData.length; i++) {
                    if (authorName === objectData[i].author) {
                        selectedAuthor = objectData[i];
                        let markup = `<tr id = "${selectedAuthor.id}">
                            <td><img src="${selectedAuthor.image}"></td>
                            <td>${selectedAuthor.alt}</td>
                            <td>${selectedAuthor.tags}</td>
                            <td>${selectedAuthor.description}</td>
                        </tr>`;
                        tableBody.insertAdjacentHTML('beforeend', markup)
                    }
                }
            }).catch(error => {
                console.log(error);
            });
        lastAuthor = authorName;
    }
}

//Function used to allow the user to see the author's current information when attempting to update the author's data.
function transferAuthorData(event) {

    var tableRow = event.target.parentNode;
    var tableRowID = tableRow.id;

    fetch("https://wt.ops.labs.vu.nl/api23/1f8b2c5d")
        .then(response => response.json())
        .then(objectData => {

            for (let i = 0; i < objectData.length; i++) {

                if (objectData[i].id == tableRowID) {
                    document.getElementsByClassName("TextBox")[5].value = objectData[i].image; //Insert the image URL into the image url input box
                    document.getElementsByClassName("TextBox")[6].value = objectData[i].author; //Insert the author name into the author input box
                    document.getElementsByClassName("TextBox")[7].value = objectData[i].alt; //Insert the alts into the alt input box
                    document.getElementsByClassName("TextBox")[8].value = objectData[i].tags; //Insert the tags into the tagsinput box
                    document.getElementsByClassName("TextBox")[9].value = objectData[i].description; //Insert the image URL into the image url input box
                    document.getElementById("authorID").value = tableRowID;
                }
            }
        }).catch(error => {
            console.log(error);
        });
}

getAuthorData(); //Used to load the information as the HTML file is loaded.

resetBtn.addEventListener("click", resetData);

//The event listener inspiration came about from: https://www.w3schools.com/howto/howto_js_filter_table.asp//
//It is used to filter the author tags through the search box. Unfortunately, it does not work for the author names.
searchBoxFilter.addEventListener("keyup", function () {
    var filter = searchBoxFilter.value.toUpperCase();
    var tableRow = table.getElementsByTagName("tr");
    for (var i = 0; i < tableRow.length; i++) {
        var tableData = tableRow[i].getElementsByTagName("td")[2];
        if (tableData) {
            var textValue = tableData.textContent || tableData.innerText;
            if (textValue.toUpperCase().indexOf(filter) > -1) {
                tableRow[i].style.display = "";
            } else {
                tableRow[i].style.display = "none";
            }
        }
    }
});

//Event listener used to allow a user to update the selected row that they choose.
tableBody.addEventListener("click", function (event) {

    transferAuthorData(event);
    updateModal.style.display = "block";
});

//Event listener for the author buttons (used for filtration of the table)
authorDiv.addEventListener("click", function (event) {

    if (event.target.id != "AuthorDiv") {
        filterTable(event);
    }

});

//Submit button action listener
authorInputForm.addEventListener("submit", event => {
    event.preventDefault();

    const authorFormData = new FormData(authorInputForm);
    const authorDataObject = Object.fromEntries(authorFormData);

    fetch("https://wt.ops.labs.vu.nl/api23/1f8b2c5d", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(authorDataObject)
        }).then(() => getAuthorData())
        .catch(error => {
            console.log(error);
        });

    submitModal.style.display = "none";

});

//Update button inside of the modal listener, used to retrieve the ID of the selected author row
updateButton.addEventListener("click", event => {
    event.preventDefault();

    var authorID = document.getElementById("authorID").value;

    fetch("https://wt.ops.labs.vu.nl/api23/1f8b2c5d")
        .then(response => response.json())
        .then(() => updateAuthor(authorID)).catch(error => {
            console.log(error);
        });

    updateModal.style.display = "none";
});

//All of the following code came about from this source: https://www.w3schools.com/howto/howto_css_modals.asp//

//Event listener used to display the submit form modal box
submitButton.addEventListener("click", function () {
    submitModal.style.display = "block";
    // When the user clicks on the button, open the modal
});

//Event listener used to close the submit modal box (the X)
submitSpan.addEventListener("click", function () {
    submitModal.style.display = "none";
    // When the user clicks on <span> (x), close the modal

});

//Event listener used for when the user clicks anywhere outside of the submit modal, it closes it
window.addEventListener("click", function (event) {
    if (event.target == submitModal) {
        submitModal.style.display = "none";

    }
});

//Event listener used to display the update form modal box
updateBtn.addEventListener("click", function () {
    alert("Please select the row that you want to update.")
});

//Event listener used to close the update modal box (the X)
updateSpan.addEventListener("click", function () {
    updateModal.style.display = "none";
});

//Event listener used for when the user clicks anywhere outside of the update modal, it closes it
window.addEventListener("click", function (event) {
    if (event.target == updateModal) {
        updateModal.style.display = "none";
    }
});