<template>
  <div>
    <!-- Editor -->
    <div v-if="showEditor">

      <!-- Username-->
      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label">Username</label>
        </div>
        <div class="field-body">
          <div class="field">
            <div class="control is-expanded has-icons-left">
              <input class="input" type="text" :value="user.username" disabled v-if="!create">
              <input class="input" type="text" v-model="user.username" :disabled="loading" v-else>
              <span class="icon is-small is-left">
                <i class="fas fa-user"></i>
              </span>
            </div>
            <div v-if="hasError('username')">
              <p class="help is-danger" v-for="(msg, index) in errors['errors.username']" :key="index">
                {{ msg }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Email-->
      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label">Email</label>
        </div>
        <div class="field-body">
          <div class="field">
            <div class="control is-expanded has-icons-left">
              <input class="input" type="email" v-model="user.email" :disabled="loading">
              <span class="icon is-small is-left">
                <i class="fas fa-envelope"></i>
              </span>
            </div>
            <div v-if="hasError('email')">
              <p class="help is-danger" v-for="(msg, index) in errors['errors.email']" :key="index">
                {{ msg }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Role-->
      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label">Role</label>
        </div>
        <div class="field-body">
          <div class="field">
            <div class="control is-expanded has-icons-left">
              <div class="select">
                <select v-model="user.role" :disabled="loading">
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <span class="icon is-small is-left">
                <i class="fas fa-tag"></i>
              </span>
            </div> <!-- end .control -->
            <div v-if="hasError('role')">
              <p class="help is-danger" v-for="(msg, index) in errors['errors.role']" :key="index">
                {{ msg }}
              </p>
            </div>
          </div> <!-- end .field -->
        </div> <!-- end .field-body -->
      </div>

      <hr>

      <!-- Change password-->
      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label">Change password</label>
        </div>
        <div class="field-body">
          <div class="field">
            <div class="control is-expanded has-icons-left">
              <input class="input" type="password" v-model="user.password" :disabled="loading">
              <span class="icon is-small is-left">
                <i class="fas fa-key"></i>
              </span>
            </div>
            <div v-if="hasError('password')">
              <p class="help is-danger" v-for="(msg, index) in errors['errors.password']" :key="index">
                {{ msg }}
              </p>
            </div>
          </div> <!-- end .field -->
        </div> <!-- end .field-body -->
      </div> <!-- end .field -->

      <hr>

      <div class="buttons is-right">
        <span class="button" @click="cancel" :disabled="loading">Cancel</span>
        <span class="button is-success" @click="save" :disabled="loading">{{ create ? 'Create' : 'Save' }}</span>
        <span class="button is-danger" @click="deleteUser = true" :disabled="loading" v-if="!create">Delete</span>
      </div>
    </div>

    <!-- Delete User -->
    <delete :user="user" @cancel="deleteUser = false" @finish="onDeleted" v-else-if="showDelete"></delete>

    <!-- Loading indicator -->
    <div class="loading" v-else>
      <span style="margin-right: 10px;">Loading...</span>
      <i class="fas fa-sync-alt fa-spin fa-lg"></i>
    </div>

  </div>
</template>

<script>
// Require components
const Delete = require('./Delete');

module.exports = {
  name: 'UserEditor',
  components: { Delete },

  props: {
    user: {
      type: Object,
      default: () => ({})
    },
    create: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      loading: false,
      errors: null,
      deleteUser: false
    }
  },
  computed: {
    showEditor() {
      return !this.loading && !this.deleteUser;
    },
    showDelete() {
      return !this.loading && this.deleteUser;
    }
  },

  methods: {
    hasError(property) {
      return this.errors && this.errors['errors.' + property];
    },
    cancel() {
      if (this.loading) return;
      this.$emit('finish');
    },
    filterUser() {
      const copy = this.user;
      delete copy.username;
      for (let property in this.user) {
        if (!copy[property]) {
          delete copy[property];
        }
      }
      return copy;
    },
    save() {
      if (this.loading) return;

      this.loading = true;
      const method = this.create ? 'put' : 'patch';
      const action = this.create ? 'create' : 'edit';
      const data = this.create ? this.user : this.filterUser();
      axios[method]('/admin/user/' + action, data)
        .then(response => {
          alert(`The User has been ${this.create ? 'created' : 'updated'}.`);
          this.errors = null;
        })
        .catch(err => {
          switch (err.response.status) {
            case 422: // validation errors
              this.errors = null;
              this.errors = err.response.data.errors;
              break;
            default: // default to just logging
              console.error(err.response);
              alert(err);
              break;
          }
        })
        .then(() => {
          this.loading = false;
        });
    },
    onDeleted() {
      this.$parent.refresh();
      this.cancel();
    }
  }
};
</script>
