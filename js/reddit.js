//http://www.reddit.com/r/specart/.json
App = Ember.Application.create({
});

App.subredditList = [];
App.subreddits = Ember.ArrayController.create();

App.ApplicationController = Ember.Controller.extend({
  requestDelay: function() {
    return this.requestQueNum * 1000;
  }.property('requestQueNum'),
  requestQueNum: 0,
  init: function() {
    var json, _this = this;
    try {
      json = JSON.parse(localStorage.getItem('subreddits'));
    } catch(e) {
    }
    if (json instanceof Array) {
      json.forEach(function(subreddit) {
        _this.fetch(subreddit);
      });
    } else {
      localStorage.removeItem('subreddits');
    }
  },
  removeSubreddit: function(object) {
    var subreddit = object.name;
    App.subredditList.splice(App.subredditList.indexOf(subreddit), 1);
    App.subreddits.removeObject(object);
    this.saveSubReddits();
  },
  addSubreddit: function(subreddit, textField) {
    var _this = this;
    if (textField) {
      textField.set('value', '');
    }
    if (subreddit && App.subredditList.indexOf(subreddit) === -1) {
      this.fetch(subreddit);
      this.saveSubReddits();
    }
  },
  fetch: function(subreddit) {
    var _this = this;
    var array = Ember.ArrayProxy.create({ name: subreddit, content: [] });
    var url = "http://www.reddit.com/r/" + subreddit + "/.json?jsonp=?";
    App.subreddits.addObject(array);
    App.subredditList.push(subreddit);
    this.refreshPage(array, url);
  },
  nextPage: function(array) {
    var url = "http://www.reddit.com/r/" + array.get('name') + "/.json?jsonp=?&count=25&after=" + array.get('after');
    this.refreshPage(array, url);
  },
  prevPage: function(array) {
    var url = "http://www.reddit.com/r/" + array.get('name')+ "/.json?jsonp=?&count=25&before=" + array.get('before');
    this.refreshPage(array, url);
  },
  refreshPage: function(array, url) {
    var _this = this, subreddit = array.get('name');
    array.clear();
    array.set('processing', true);
    this.wait(this.get('requestDelay'), function() {
      _this.set('requestQueNum', _this.get('requestQueNum ') + 1);
      //url = "reddit.json";
      $.getJSON(url, function(data) {
        _this.set('requestQueNum', _this.get('requestQueNum ') - 1);
        array.set('processing', false);
        array.set('after', data.data.after);
        array.set('before', data.data.before);
        data.data.children.forEach(function(item) {
          if(item.data.thumbnail.indexOf('http') === -1) {
            item.data.noThumb = true;
          }
          item.data.permalink = "http://www.reddit.com" + item.data.permalink;
          array.addObject(item.data);
        });
      });
    });
  },
  wait: function(wait, cb) {
    setTimeout(function() {
      cb();
    }, wait);
  },

  saveSubReddits: function() {
    var jsonString = JSON.stringify(App.subredditList);
    localStorage.setItem('subreddits', jsonString);
  },
  focusInput: true
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return App.subreddits;
  }
});

App.IndexController = Ember.Controller.extend({
  needs: ['application'],
  removeSubredditBinding: 'controllers.application.removeSubreddit',
  saveSubRedditsBinding: 'controllers.application.saveSubReddits',
  nextPageBinding: 'controllers.application.nextPage',
  prevPageBinding: 'controllers.application.prevPage',
  refreshPageBinding: 'controllers.application.refreshPage',
  waitBinding: 'controllers.application.wait',
  showContent: function(url) {
    this.set('contentUrl', url);
  }
});



App.SubRedditView = Ember.View.extend({
  templateName: 'subreddit'
});

App.PostItem = Ember.View.extend({
  templateName: 'post',
  showContent: function(a, b) {
    var controller = this.get('controller');
  }
});

App.ContentView = Ember.View.extend({
  templateName: 'content',
  didInsertElement: function() {
    var width = this.$().width();
    this.$().width(0);
    this.$().animate({ width: width }, 1000);
  }
});

App.FocusTextField = Ember.TextField.extend({
  attributeBindings: ['autofocus'],
  autofocus: true
});

Ember.Handlebars.registerBoundHelper('date', function(value) {
  return moment.unix(value).fromNow();
});

