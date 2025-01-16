/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@/styles/main.scss'

// Composables
import { createVuetify } from 'vuetify'
// import { md3 } from 'vuetify/blueprints'

// Custom theme
const lightTheme = {
    dark: false,
    colors: {
        background: '#F8F6FD',
        surface: '#FFFFFF',
        'surface-variant': '#F2F2F2',
        'on-surface-variant': '#1C1B1F',
        primary: '#6750A4',
        'primary-darken-1': '#3700B3',
        secondary: '#625B71',
        'secondary-darken-1': '#4A4458',
        error: '#B3261E',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FB8C00'
    },
    elevation: {
        0: 'none',
        1: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        2: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        3: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
        4: '0px 2px 3px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
        5: '0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)'
    }
}

const darkTheme = {
    dark: true,
    colors: {
        background: '#2A2438',
        surface: '#1C1B1F',
        'surface-variant': '#2F2F2F',
        'on-surface-variant': '#E6E1E5',
        primary: '#D0BCFF',
        'primary-darken-1': '#9A82DB',
        secondary: '#CCC2DC',
        'secondary-darken-1': '#9A91AC',
        error: '#F2B8B5',
        info: '#64B5F6',
        success: '#81C784',
        warning: '#FFB74D'
    }
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
    theme: {
        defaultTheme: 'light',
        themes: {
            light: lightTheme,
            dark: darkTheme
        }
    },
    defaults: {
        VCard: {
            elevation: 1,
            rounded: 'lg'
        },
        VBtn: {
            rounded: 'lg',
            elevation: 1,
            height: 40
        },
        VTextField: {
            variant: 'outlined',
            density: 'comfortable',
            rounded: 'lg'
        },
        VTextarea: {
            variant: 'outlined',
            density: 'comfortable',
            rounded: 'lg'
        },
        VToolbar: {
            elevation: 0
        },
        VList: {
            elevation: 1,
            rounded: 'lg'
        },
        VListItem: {
            rounded: 'lg',
            minHeight: 44
        },
        VAvatar: {
            rounded: 'lg'
        },
        VDialog: {
            rounded: 'xl'
        }
    }
})
