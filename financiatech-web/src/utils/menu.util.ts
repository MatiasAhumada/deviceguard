export function getCenteredMenuPosition(menuWidth = 192, menuHeight = 200) {
  return {
    top: window.innerHeight / 2 - menuHeight / 2,
    left: window.innerWidth / 2 - menuWidth / 2,
  };
}
