<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <div class="login-background">
        <div class="bg-gradient"></div>
        <div class="bg-pattern"></div>
      </div>

      <div
        class="flex flex-center q-pa-md"
        style="min-height: 100vh; position: relative; z-index: 10"
      >
        <q-card
          flat
          class="login-card row no-wrap overflow-hidden"
          style="max-width: 900px; width: 100%"
        >
          <div
            class="col-6 hospital-panel text-white flex flex-center column q-pa-xl"
            :class="$q.screen.lt.md ? 'hidden' : 'col-6'"
          >
            <div class="hospital-icon-wrapper q-mb-lg">
              <div class="icon-background"></div>
              <q-icon name="local_hospital" size="48px" color="white" class="hospital-icon" />
            </div>

            <div class="text-h3 q-mb-md text-center font-weight-bold hospital-title">
              Mi Hospital
            </div>

            <div class="text-body1 text-center q-mb-xl hospital-description">
              Gestión integral de pacientes y personal médico con la mejor tecnología y cuidado
              personalizado.
            </div>

            <div class="row q-gutter-lg">
              <div class="flex items-center">
                <div class="status-indicator status-secure"></div>
                <span class="text-body2 q-ml-sm">Seguro</span>
              </div>
              <div class="flex items-center">
                <div class="status-indicator status-reliable"></div>
                <span class="text-body2 q-ml-sm">Confiable</span>
              </div>
              <div class="flex items-center">
                <div class="status-indicator status-modern"></div>
                <span class="text-body2 q-ml-sm">Moderno</span>
              </div>
            </div>
          </div>

          <div
            class="col-6 flex flex-center login-form-panel"
            :class="$q.screen.lt.md ? 'col-12' : 'col-6'"
          >
            <q-card-section class="full-width q-pa-xl">
              <div v-if="$q.screen.lt.md" class="text-center q-mb-xl">
                <div class="mobile-hospital-icon q-mb-md">
                  <q-icon name="local_hospital" size="40px" color="teal-6" />
                </div>
                <div class="text-h4 text-weight-bold text-grey-8 q-mb-sm">Mi Hospital</div>
              </div>

              <div class="text-center q-mb-xl">
                <div class="text-h4 text-weight-bold welcome-title q-mb-sm">Bienvenido</div>
                <div class="text-subtitle1 welcome-subtitle">
                  Ingresa para administrar el sistema
                </div>
              </div>

              <q-form @submit.prevent="handleLogin" class="q-gutter-lg">
                <div class="input-wrapper">
                  <q-input
                    filled
                    v-model="email"
                    type="email"
                    placeholder="tu@correo.com"
                    class="elegant-input"
                    hide-bottom-space
                  >
                    <template v-slot:prepend>
                      <q-icon name="mail_outline" color="teal-6" size="20px" />
                    </template>
                  </q-input>
                </div>

                <div class="input-wrapper">
                  <q-input
                    filled
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    class="elegant-input"
                    hide-bottom-space
                  >
                    <template v-slot:prepend>
                      <q-icon name="lock" color="teal-6" size="20px" />
                    </template>
                    <template v-slot:append>
                      <q-icon
                        :name="showPassword ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer password-toggle"
                        color="grey-6"
                        size="20px"
                        @click="showPassword = !showPassword"
                      />
                    </template>
                  </q-input>
                </div>

                <q-btn
                  type="submit"
                  class="full-width elegant-login-btn"
                  unelevated
                  no-caps
                  size="lg"
                  :loading="userStore.loading"
                >
                  <span v-if="!userStore.loading" class="flex items-center">
                    <span class="q-mr-sm">Ingresar</span>
                    <q-icon name="arrow_forward" size="18px" />
                  </span>
                  <span v-else>Ingresando...</span>
                </q-btn>
              </q-form>

              <div class="text-center q-mt-xl">
                <div class="text-body2 support-text q-mb-sm">¿Tienes problemas?</div>
                <q-btn
                  flat
                  dense
                  label="Contacta a Soporte"
                  color="teal-6"
                  class="support-btn"
                  no-caps
                />
              </div>

              <div class="flex justify-center items-center q-mt-lg security-badge">
                <q-icon name="security" color="green-6" size="16px" class="q-mr-xs" />
                <span class="text-caption">Conexión segura SSL</span>
              </div>
            </q-card-section>
          </div>
        </q-card>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from 'stores/user'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  try {
    const destination = await userStore.login(email.value, password.value)
    // destination debería ser algo como { name: 'dashboard' } o { name: 'AccessDenied' }
    if (destination) {
      router.push(destination)
    } else {
      // fallback prudente
      router.push({ name: 'AccessDenied' })
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: err })
  }
}
</script>

<style scoped>
/* Background elegante y sutil */
.login-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(20, 184, 166, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
}

/* Main Card */
.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hospital Panel */
.hospital-panel {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  position: relative;
  overflow: hidden;
}

.hospital-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.hospital-icon-wrapper {
  position: relative;
  z-index: 2;
}

.icon-background {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  filter: blur(15px);
}

.hospital-icon {
  position: relative;
  z-index: 3;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.hospital-title {
  background: linear-gradient(45deg, #ffffff, #f0f9ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.hospital-description {
  opacity: 0.95;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.status-secure {
  background: #10b981;
}

.status-reliable {
  background: #06b6d4;
}

.status-modern {
  background: #3b82f6;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* Form Panel */
.login-form-panel {
  background: white;
}

.mobile-hospital-icon {
  display: inline-flex;
  padding: 12px;
  background: linear-gradient(45deg, rgba(20, 184, 166, 0.1), rgba(6, 182, 212, 0.1));
  border-radius: 16px;
}

.welcome-title {
  background: linear-gradient(135deg, #1e293b, #374151);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  color: #64748b;
}

/* Elegant Inputs */
.input-wrapper {
  position: relative;
}

.elegant-input :deep(.q-field__control) {
  border-radius: 12px !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.elegant-input :deep(.q-field__control):hover {
  background: #f1f5f9 !important;
  border-color: rgba(20, 184, 166, 0.3) !important;
}

.elegant-input :deep(.q-field--focused .q-field__control) {
  border-color: #14b8a6 !important;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1) !important;
  background: white !important;
}

.elegant-input :deep(.q-field__native) {
  padding: 14px 16px !important;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
}

.password-toggle:hover {
  color: #14b8a6 !important;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

/* Buttons */
.elegant-login-btn {
  background: linear-gradient(135deg, #14b8a6, #06b6d4) !important;
  color: white !important;
  border-radius: 12px !important;
  padding: 14px 24px !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.25) !important;
  transition: all 0.2s ease !important;
}

.elegant-login-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px rgba(20, 184, 166, 0.3) !important;
}

.elegant-login-btn:active {
  transform: translateY(0px) !important;
}

.forgot-btn:hover,
.support-btn:hover {
  background: rgba(20, 184, 166, 0.08) !important;
  border-radius: 8px;
}

/* Text Styles */
.support-text {
  color: #64748b;
}

.security-badge {
  color: #64748b;
}

/* Responsive */
@media (max-width: 768px) {
  .login-card {
    margin: 16px;
    border-radius: 12px;
  }

  .hospital-title {
    font-size: 1.8rem;
  }

  .hospital-description {
    font-size: 0.9rem;
  }
}
</style>
