!define MUI_BGCOLOR "000000"
!define MUI_TEXTCOLOR "FFFFFF"
!define MUI_HEADER_BGCOLOR "000000"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "${__FILEDIR__}\\vanta-header.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_WELCOMEPAGE_TITLE "VANTA 2.0.2"
!define MUI_WELCOMEPAGE_TEXT "Install VANTA DOTA2 HUB\\r\\n\\r\\nA focused, modern workspace for your Dota 2 mod library."
!define MUI_FINISHPAGE_RUN_TEXT "Launch VANTA"
!include "MUI2.nsh"
!include "nsDialogs.nsh"

Var VantaDesktopShortcutCheckbox
Var VantaDesktopShortcut

LangString VantaShortcutTitle 1033 "VANTA shortcut"
LangString VantaShortcutPrompt 1033 "Create a VANTA shortcut on your desktop?"
LangString VantaShortcutCheckbox 1033 "Create a desktop shortcut"
LangString VantaShortcutTitle 1049 "Ярлык VANTA"
LangString VantaShortcutPrompt 1049 "Создать ярлык VANTA на рабочем столе?"
LangString VantaShortcutCheckbox 1049 "Создать ярлык на рабочем столе"

Page custom VantaDesktopShortcutPageCreate VantaDesktopShortcutPageLeave

Function VantaDesktopShortcutPageCreate
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 24u "$(VantaShortcutTitle)"
  Pop $0
  ${NSD_CreateLabel} 0 30u 100% 32u "$(VantaShortcutPrompt)"
  Pop $0
  ${NSD_CreateCheckbox} 0 72u 100% 14u "$(VantaShortcutCheckbox)"
  Pop $VantaDesktopShortcutCheckbox
  ${NSD_SetState} $VantaDesktopShortcutCheckbox ${BST_CHECKED}
  nsDialogs::Show
FunctionEnd

Function VantaDesktopShortcutPageLeave
  ${NSD_GetState} $VantaDesktopShortcutCheckbox $VantaDesktopShortcut
FunctionEnd

!macro customInstall
  ${If} $VantaDesktopShortcut == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\VANTA.lnk" "$INSTDIR\VANTA.exe"
  ${EndIf}
!macroend

!macro customUnInstall
  Delete "$DESKTOP\VANTA.lnk"
!macroend
