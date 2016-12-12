function Chatroom() {
    this.normalMessageAction = "normal";
    this.viewHistoryMessageAction = "history";
    this.isSendingMessage = false;
    this.profilePhotoContainer = document.querySelector('.signout:first-child');
    this.userNameContainer = document.querySelector('.signout:nth-child(2)');
    this.signInButtonContainer = document.querySelector('.signin');
    this.signOutButtonContainer = document.querySelector('.signout:nth-child(3)');
    this.userName = document.getElementById('user-name');
    this.signInButton =  document.getElementById('signin-button');
    this.signOutButton = document.getElementById('signout-button');
    this.modalSignInButton = document.getElementById('modal-signin-button');
    this.history = document.querySelector('.row.history-row');
    this.inputMessage = document.getElementById('input-message');
    this.sendMessage = document.getElementById('send-message');
    this.loader = document.querySelector('.loader-container');
    
    this.maximumMessages = 30;

    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.history.addEventListener('scroll', this.scrollHistory.bind(this));
    this.inputMessage.addEventListener('keyup', this.saveMessage.bind(this));
    this.modalSignInButton.addEventListener('click', this.signIn.bind(this));

    this.sendMessage.addEventListener('click', this.saveMessage.bind(this));

    this.initFirebase();
}

Chatroom.prototype.initFirebase = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();

  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

Chatroom.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

Chatroom.prototype.signOut = function() {
  this.auth.signOut();
}

Chatroom.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;

    this.profilePhotoContainer.querySelector('.photo').style.backgroundImage = 'url('+profilePicUrl+')';
    this.userName.textContent = userName;

    this.profilePhotoContainer.className = "signout profile-photo";
    this.userNameContainer.className = "signout";
    this.signOutButtonContainer.className = "signout";
    this.signInButtonContainer.className = "signin hidden";
    this.showLoader();
    this.loadMessages(this.normalMessageAction);
    this.hideLoader();
  } else { // User is signed out!
    this.signInButtonContainer.className = "signin";
    this.profilePhotoContainer.className = "signout profile-photo hidden";
    this.userNameContainer.className = "signout hidden";
    this.signOutButtonContainer.className = "signout hidden";
  }
}

Chatroom.prototype.checkSignedIn = function() {
  if (this.auth.currentUser) {
    return true;
  }

  $('#please-login-modal').modal('show');
  return false;
}

Chatroom.prototype.scrollHistory = function(e) {
  /*if (this.history.scrollTop == 0) {
    this.maximumMessages += 10;
    this.history.innerHTML = "";
    this.loadMessages(this.viewHistoryMessageAction);
  }*/
}

Chatroom.prototype.loadMessages = function(action) {
  this.messagesRef = this.database.ref('messages');
  this.messagesRef.off();

  var setMessage = function(data) {
    var val = data.val();
    /*if (action == this.viewHistoryMessageAction) {
      this.renderHistoryMessage(data.key, val.name, val.text, val.photoUrl);
    }
    else if (action == this.normalMessageAction) {
      this.renderMessage(data.key, val.name, val.text, val.photoUrl);
    }*/
    this.renderMessage(data.key, val.name, val.text, val.photoUrl);
  }.bind(this);
  this.messagesRef.limitToLast(this.maximumMessages).on('child_added', setMessage);
  this.messagesRef.limitToLast(this.maximumMessages).on('child_changed', setMessage);
}

Chatroom.prototype.saveMessage = function(e) {
  e.preventDefault();
  if ((e.type == "click" || e.keyCode == 13) && this.inputMessage.value && this.checkSignedIn() && !this.isSendingMessage) {
    this.isSendingMessage = true;
    var currentUser = this.auth.currentUser;
    this.messagesRef.push({
      name: currentUser.displayName,
      text: this.inputMessage.value,
      photoUrl: currentUser.photoURL || null
    }).then(function() {
      this.isSendingMessage = false;
      this.clearInputMessage();
    }.bind(this)).catch(function(error) {
      console.error("Error write new message to Firebase Database", error);
    }); 
  }
}

Chatroom.prototype.renderMessage = function(key, name, text, photoUrl) {
  var div = document.getElementById(key);
  if(!div) {
    var container = document.createElement('div');
    container.innerHTML = Chatroom.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.history.appendChild(div);
  }
  var currentUser = this.auth.currentUser;
  if (currentUser.displayName === name) {
    div.querySelector(".message-block").className = "message-block from-me";
  }
  div.querySelector('.photo').style.backgroundImage = 'url('+photoUrl+')';
  div.querySelector('.sender').innerHTML = '<span>'+name+'</span>';
  div.querySelector('.message-text').innerHTML = '<span>'+text+'</span>';
  this.history.scrollTop = this.history.scrollHeight;
  this.inputMessage.focus();
}

Chatroom.prototype.renderHistoryMessage = function(key, name, text, photoUrl) {
  var div = document.getElementById(key);
  if(!div) {
    var container = document.createElement('div');
    container.innerHTML = Chatroom.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.history.appendChild(div);
  }
  var currentUser = this.auth.currentUser;
  if (currentUser.displayName === name) {
    div.querySelector(".message-block").className = "message-block from-me";
  }
  div.querySelector('.photo').style.backgroundImage = 'url('+photoUrl+')';
  div.querySelector('.sender').innerHTML = '<span>'+name+'</span>';
  div.querySelector('.message-text').innerHTML = '<span>'+text+'</span>';
}

Chatroom.prototype.clearInputMessage = function() {
  this.inputMessage.value = "";
}

Chatroom.MESSAGE_TEMPLATE = '<div class="message-block-container">'+
                              '<div class="message-block">'+
                                '<div class="profile-photo">'+
                                  '<div class="photo"></div>'+
                                '</div>'+
                                '<div class="message">'+
                                  '<div class="message-text">'+
                                  '</div>'+
                                  '<div class="sender">'+
                                  '</div>'+
                                '</div>'+
                              '</div>'+
                            '</div>';

Chatroom.prototype.showLoader = function() {
  this.loader.className = "loader-container";
}

Chatroom.prototype.hideLoader = function() {
  this.loader.className = "loader-container hidden";
}

window.onload = function() {
  window.chatroom = new Chatroom();
};