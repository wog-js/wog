// Require dependencies
require('./util/bootstrap');
const isMounted = require('vue-is-mounted');

// create vue app
new Vue({
  name: 'Administration',
  el: '#app',
  mixins: [ isMounted ],

  data: {
    components: [
      {
        name: 'Users',
        description: 'Create, edit or delete users.',
        icon: 'fas fa-users',
        component: require('../vue/admin/users/'),
        actions: [
          {
            icon: 'fas fa-sync-alt',
            name: 'Refresh',
            description: 'Reload the user list.',
            handler() {
              this.refresh();
            }
          },
          {
            icon: 'fas fa-trash-alt',
            name: 'Reset',
            description: 'Reset all filters.',
            handler() {
              this.reset();
            }
          },
          {
            icon: 'fas fa-user-plus',
            name: 'Create a User',
            handler() {
              this.create = true;
            }
          }
        ]
      },
      {
        name: 'Config',
        description: 'Inspect configuration values.',
        icon: 'fas fa-cog',
        component: require('../vue/admin/config/'),
        actions: [
          {
            icon: 'fas fa-sync-alt',
            name: 'Refresh',
            description: 'Reload the config values.',
            handler() {
              this.refresh();
            }
          }
        ]
      },
      {
        name: 'Statistics',
        description: 'View some general application statistics.',
        icon: 'fas fa-chart-bar',
        component: require('../vue/admin/statistics/'),
        actions: [
          {
            icon: 'fas fa-sync-alt',
            name: 'Refresh',
            description: 'Reload the statistics.',
            handler() {
              this.refresh();
            }
          }
        ]
      }
    ],
    selected: 0
  },
  computed: {
    theComponent() {
      return this.components[this.selected];
    },
    theActions() {
      return this.theComponent.actions || [];
    }
  },
  watch: {
    isMounted(val) {
      if (val) {
        $('.fader').fadeOut(500, () => $(this).remove());

        const selected = localStorage.getItem('wog_administration_selected');
        if (selected) this.selected = parseInt(selected);
      }
    },
    selected(val) {
      localStorage.setItem('wog_administration_selected', val);
    }
  },

  methods: {
    showActions() {
      if (!this.isMounted) return false;
      if (!this.$refs.theComponent) return false;
      return this.$refs.theComponent.showActions;
    },
    handleAction(index) {
      this.theActions[index].handler.call(this.$refs.theComponent);
    }
  }
});
