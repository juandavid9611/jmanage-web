import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function NotificationsDrawer({ data = [], sx, ...other }) {
  const { user } = useAuthContext();
  // return (
  //   <MagicBellProvider
  //     apiKey={CONFIG.site.magicBellApiKey}
  //     userEmail={user.email} // Replace with the logged-in user's email
  //   >
  //     <MagicBell
  //       theme={{
  //         header: { backgroundColor: '#000', textColor: '#fff' },
  //         footer: { backgroundColor: '#000' },
  //       }}
  //     >
  //       {(props) => (
  //         <FloatingNotificationInbox
  //           width={window.innerWidth < 600 ? 333 : 500}
  //           height={480}
  //           notificationPreferencesEnabled={false}
  //           placement="bottom-end"
  //           {...props}
  //         />
  //       )}
  //     </MagicBell>
  //   </MagicBellProvider>
  // );
}
