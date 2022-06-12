//save radio selection

function radioSelect() {
  console.log("test");
  var inputs = document.querySelectorAll("input");

  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].checked) {
      // save selection to mongoDB
      console.log(inputs[i].getAttribute("id") + " checked");
    }
  }
}

// module.exports.radioSelect = radioSelect;
