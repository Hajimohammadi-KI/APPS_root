using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;

[assembly: AssemblyTitle("__PRODUCT_NAME__ Setup")]
[assembly: AssemblyDescription("Modern one-click setup, update, and uninstall manager")]
[assembly: AssemblyCompany("__PUBLISHER__")]
[assembly: AssemblyProduct("__PRODUCT_NAME__")]
[assembly: AssemblyVersion("__VERSION__")]
[assembly: AssemblyFileVersion("__VERSION__")]

namespace ModernLanguageSetup
{
    internal static class Product
    {
        internal const string Name = "__PRODUCT_NAME__";
        internal const string Version = "__VERSION__";
        internal const string Publisher = "__PUBLISHER__";
        internal const string ProductId = "__PRODUCT_ID__";
        internal const string InstallFolder = "__INSTALL_FOLDER__";
        internal const string DataFolder = "__DATA_FOLDER__";
        internal const string MainExecutable = "__MAIN_EXECUTABLE__";
        internal const string SetupFileName = "__SETUP_FILE__";
        internal const string ShortcutName = "__SHORTCUT_NAME__";
        internal const string EnvironmentPrefix = "__ENV_PREFIX__";
        internal const string Locale = "__LOCALE__";
        internal const string IdentityLabel = "__IDENTITY_LABEL__";
        internal const string MarketingTitle = "__MARKETING_TITLE__";
        internal const string Tagline = "__TAGLINE__";
        internal const string MotifOne = "__MOTIF_ONE__";
        internal const string MotifTwo = "__MOTIF_TWO__";
        internal const string MotifThree = "__MOTIF_THREE__";

        internal static bool IsGerman
        {
            get { return String.Equals(Locale, "de", StringComparison.OrdinalIgnoreCase); }
        }

        internal static readonly string InstallRoot =
            Environment.GetEnvironmentVariable(EnvironmentPrefix + "_INSTALL_ROOT") ??
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs",
                InstallFolder);

        internal static readonly string DataRoot =
            Environment.GetEnvironmentVariable(EnvironmentPrefix + "_DATA_ROOT") ??
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                DataFolder);

        internal static string CurrentExecutable
        {
            get { return Assembly.GetExecutingAssembly().Location; }
        }

        internal static string InstalledSetup
        {
            get { return Path.Combine(InstallRoot, SetupFileName); }
        }

        internal static string InstalledVersion
        {
            get
            {
                string file = Path.Combine(InstallRoot, "version.txt");
                if (!File.Exists(file))
                    return null;
                return File.ReadAllText(file, Encoding.UTF8).Trim();
            }
        }

        internal static bool IsInstalled
        {
            get
            {
                return File.Exists(Path.Combine(InstallRoot, MainExecutable)) &&
                       File.Exists(Path.Combine(InstallRoot, "version.txt"));
            }
        }
    }

    internal static class NativeMethods
    {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        internal static extern bool MoveFileEx(
            string existingFileName,
            string newFileName,
            int flags);

        internal const int MoveFileDelayUntilReboot = 0x4;
    }

    internal static class Installer
    {
        private static readonly string[] RequiredPayloadFiles =
        {
            Product.MainExecutable,
            "version.txt"
        };

        internal static void Install(Action<int, string> progress)
        {
            string parent = Path.GetDirectoryName(Product.InstallRoot);
            if (String.IsNullOrWhiteSpace(parent))
                throw new InvalidOperationException(Product.IsGerman
                    ? "Der Installationspfad ist ungültig."
                    : "The installation path is invalid.");

            Directory.CreateDirectory(parent);
            Directory.CreateDirectory(Product.DataRoot);

            string staging = Path.Combine(
                parent,
                "." + Product.ProductId + ".installing-" + Guid.NewGuid().ToString("N"));
            string backup = Path.Combine(
                parent,
                "." + Product.ProductId + ".previous-" + Guid.NewGuid().ToString("N"));

            try
            {
                progress(8, Text("Installationspaket wird geprüft …", "Checking the installation package …"));
                Directory.CreateDirectory(staging);
                ExtractPayload(staging, progress);
                VerifyPayload(staging);

                progress(62, Text("Vorhandene Prozesse werden beendet …", "Closing the running application …"));
                StopInstalledProcesses();

                File.Copy(Product.CurrentExecutable, Path.Combine(staging, Product.SetupFileName), true);

                bool hadPreviousInstall = Directory.Exists(Product.InstallRoot);
                if (hadPreviousInstall)
                {
                    progress(70, Text(
                        "Vorhandene Version wird sicher aktualisiert …",
                        "Safely updating the existing version …"));
                    MoveDirectoryWithRetry(Product.InstallRoot, backup);
                }

                try
                {
                    MoveDirectoryWithRetry(staging, Product.InstallRoot);
                }
                catch
                {
                    if (hadPreviousInstall && Directory.Exists(backup) &&
                        !Directory.Exists(Product.InstallRoot))
                    {
                        Directory.Move(backup, Product.InstallRoot);
                    }
                    throw;
                }

                progress(82, Text("Verknüpfungen werden eingerichtet …", "Creating shortcuts …"));
                CreateShortcuts();
                RegisterUninstallEntry();

                progress(94, Text("Installation wird abgeschlossen …", "Completing the installation …"));
                TryDeleteDirectory(backup);
                progress(100, Product.Name + Text(" ist bereit.", " is ready."));
            }
            catch
            {
                TryDeleteDirectory(staging);
                throw;
            }
        }

        internal static void Uninstall(bool deleteData, Action<int, string> progress)
        {
            progress(12, Text("Anwendung wird beendet …", "Closing the application …"));
            StopInstalledProcesses();

            progress(35, Text("Verknüpfungen werden entfernt …", "Removing shortcuts …"));
            RemoveShortcuts();
            RemoveUninstallEntry();

            progress(62, Text("Programmdateien werden entfernt …", "Removing program files …"));
            if (Directory.Exists(Product.InstallRoot))
                DeleteDirectoryWithRetry(Product.InstallRoot);

            if (deleteData && Directory.Exists(Product.DataRoot))
            {
                progress(82, Text("Lokale Lerndaten werden entfernt …", "Removing local learning data …"));
                DeleteDirectoryWithRetry(Product.DataRoot);
            }

            progress(100, deleteData
                ? Text(
                    "Anwendung und lokale Lerndaten wurden entfernt.",
                    "The app and local learning data were removed.")
                : Text(
                    "Anwendung entfernt. Lokale Lerndaten wurden beibehalten.",
                    "The app was removed. Local learning data was preserved."));
        }

        internal static void Launch()
        {
            string executable = Path.Combine(Product.InstallRoot, Product.MainExecutable);
            if (!File.Exists(executable))
                throw new FileNotFoundException(
                    Text(
                        "Die Anwendung ist nicht vollständig installiert.",
                        "The application is not completely installed."),
                    executable);

            ProcessStartInfo info = new ProcessStartInfo
            {
                FileName = executable,
                WorkingDirectory = Product.InstallRoot,
                UseShellExecute = true
            };
            Process.Start(info);
        }

        internal static bool CurrentExecutableIsInstalledCopy()
        {
            string exe = Path.GetFullPath(Product.CurrentExecutable);
            string root = Path.GetFullPath(Product.InstallRoot)
                .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            return exe.StartsWith(root, StringComparison.OrdinalIgnoreCase);
        }

        internal static string RelaunchFromTemporaryCopy(string arguments)
        {
            string temporarySetup = Path.Combine(
                Path.GetTempPath(),
                Product.ProductId + "-Setup-" + Guid.NewGuid().ToString("N") + ".exe");
            File.Copy(Product.CurrentExecutable, temporarySetup, true);

            Process.Start(new ProcessStartInfo
            {
                FileName = temporarySetup,
                Arguments = arguments,
                UseShellExecute = true
            });
            return temporarySetup;
        }

        internal static void ScheduleSelfDelete()
        {
            NativeMethods.MoveFileEx(
                Product.CurrentExecutable,
                null,
                NativeMethods.MoveFileDelayUntilReboot);
        }

        private static void ExtractPayload(string destination, Action<int, string> progress)
        {
            Stream resource = Assembly.GetExecutingAssembly()
                .GetManifestResourceStream("Payload.zip");
            if (resource == null)
                throw new InvalidDataException(Text(
                    "Das eingebettete Installationspaket fehlt.",
                    "The embedded installation package is missing."));

            using (resource)
            using (ZipArchive archive = new ZipArchive(resource, ZipArchiveMode.Read, false))
            {
                int total = Math.Max(archive.Entries.Count, 1);
                int completed = 0;
                string root = Path.GetFullPath(destination)
                    .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    string target = Path.GetFullPath(Path.Combine(destination, entry.FullName));
                    if (!target.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                        throw new InvalidDataException(Text(
                            "Das Installationspaket enthält einen ungültigen Pfad.",
                            "The installation package contains an invalid path."));

                    if (String.IsNullOrEmpty(entry.Name))
                    {
                        Directory.CreateDirectory(target);
                    }
                    else
                    {
                        string directory = Path.GetDirectoryName(target);
                        if (!String.IsNullOrEmpty(directory))
                            Directory.CreateDirectory(directory);
                        entry.ExtractToFile(target, true);
                    }

                    completed++;
                    if (completed % 30 == 0 || completed == total)
                    {
                        int value = 10 + (int)Math.Round((completed / (double)total) * 48);
                        progress(value, Text(
                            "Programmdateien werden vorbereitet …",
                            "Preparing program files …"));
                    }
                }
            }
        }

        private static void VerifyPayload(string root)
        {
            foreach (string relative in RequiredPayloadFiles)
            {
                if (!File.Exists(Path.Combine(root, relative)))
                    throw new InvalidDataException(
                        Text(
                            "Das Installationspaket ist unvollständig: ",
                            "The installation package is incomplete: ") + relative);
            }
        }

        private static void StopInstalledProcesses()
        {
            string root = Path.GetFullPath(Product.InstallRoot)
                .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            int currentProcessId = Process.GetCurrentProcess().Id;

            foreach (Process process in Process.GetProcesses())
            {
                try
                {
                    if (process.Id == currentProcessId || process.HasExited)
                        continue;

                    string executable = Path.GetFullPath(process.MainModule.FileName);
                    if (executable.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                    {
                        process.Kill();
                        process.WaitForExit(5000);
                    }
                }
                catch
                {
                    // Protected, already-exited, and unrelated processes are safe to ignore.
                }
                finally
                {
                    process.Dispose();
                }
            }
            Thread.Sleep(500);
        }

        private static void CreateShortcuts()
        {
            if (Environment.GetEnvironmentVariable(Product.EnvironmentPrefix + "_NO_SHORTCUTS") == "1")
                return;

            string startMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Microsoft",
                "Windows",
                "Start Menu",
                "Programs",
                Product.ShortcutName);
            Directory.CreateDirectory(startMenu);

            string icon = Path.Combine(Product.InstallRoot, Product.MainExecutable);
            string executable = Path.Combine(Product.InstallRoot, Product.MainExecutable);

            CreateShortcut(
                Path.Combine(startMenu, Product.ShortcutName + ".lnk"),
                executable,
                "",
                Product.InstallRoot,
                icon,
                Text(Product.Name + " öffnen", "Open " + Product.Name));

            CreateShortcut(
                Path.Combine(
                    startMenu,
                    Text("Installation verwalten oder deinstallieren.lnk", "Manage or uninstall.lnk")),
                Product.InstalledSetup,
                "",
                Product.InstallRoot,
                icon,
                Text(
                    "Installation aktualisieren oder entfernen",
                    "Update or remove the installation"));

            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            CreateShortcut(
                Path.Combine(desktop, Product.ShortcutName + ".lnk"),
                executable,
                "",
                Product.InstallRoot,
                icon,
                Text(Product.Name + " öffnen", "Open " + Product.Name));
        }

        private static void RemoveShortcuts()
        {
            if (Environment.GetEnvironmentVariable(Product.EnvironmentPrefix + "_NO_SHORTCUTS") == "1")
                return;

            string startMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Microsoft",
                "Windows",
                "Start Menu",
                "Programs",
                Product.ShortcutName);
            TryDeleteDirectory(startMenu);

            string desktopShortcut = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                Product.ShortcutName + ".lnk");
            try { File.Delete(desktopShortcut); } catch { }
        }

        private static void CreateShortcut(
            string shortcutPath,
            string targetPath,
            string arguments,
            string workingDirectory,
            string iconPath,
            string description)
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            object shell = Activator.CreateInstance(shellType);
            object shortcut = shellType.InvokeMember(
                "CreateShortcut",
                BindingFlags.InvokeMethod,
                null,
                shell,
                new object[] { shortcutPath },
                CultureInfo.InvariantCulture);

            Type shortcutType = shortcut.GetType();
            SetComProperty(shortcutType, shortcut, "TargetPath", targetPath);
            SetComProperty(shortcutType, shortcut, "Arguments", arguments);
            SetComProperty(shortcutType, shortcut, "WorkingDirectory", workingDirectory);
            SetComProperty(shortcutType, shortcut, "IconLocation", iconPath + ",0");
            SetComProperty(shortcutType, shortcut, "Description", description);
            shortcutType.InvokeMember(
                "Save",
                BindingFlags.InvokeMethod,
                null,
                shortcut,
                null,
                CultureInfo.InvariantCulture);

            Marshal.FinalReleaseComObject(shortcut);
            Marshal.FinalReleaseComObject(shell);
        }

        private static void SetComProperty(Type type, object instance, string name, object value)
        {
            type.InvokeMember(
                name,
                BindingFlags.SetProperty,
                null,
                instance,
                new[] { value },
                CultureInfo.InvariantCulture);
        }

        private static void RegisterUninstallEntry()
        {
            if (Environment.GetEnvironmentVariable(Product.EnvironmentPrefix + "_NO_SHORTCUTS") == "1")
                return;

            using (RegistryKey key = Registry.CurrentUser.CreateSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Uninstall\" + Product.ProductId))
            {
                key.SetValue("DisplayName", Product.Name);
                key.SetValue("DisplayVersion", Product.Version);
                key.SetValue("Publisher", Product.Publisher);
                key.SetValue("InstallLocation", Product.InstallRoot);
                key.SetValue("DisplayIcon", Product.InstalledSetup);
                key.SetValue("UninstallString", Quote(Product.InstalledSetup) + " --uninstall");
                key.SetValue("ModifyPath", Quote(Product.InstalledSetup));
                key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
            }
        }

        private static void RemoveUninstallEntry()
        {
            if (Environment.GetEnvironmentVariable(Product.EnvironmentPrefix + "_NO_SHORTCUTS") == "1")
                return;

            try
            {
                Registry.CurrentUser.DeleteSubKeyTree(
                    @"Software\Microsoft\Windows\CurrentVersion\Uninstall\" + Product.ProductId,
                    false);
            }
            catch { }
        }

        private static void MoveDirectoryWithRetry(string source, string destination)
        {
            Exception last = null;
            for (int attempt = 0; attempt < 6; attempt++)
            {
                try
                {
                    Directory.Move(source, destination);
                    return;
                }
                catch (Exception ex)
                {
                    last = ex;
                    Thread.Sleep(250 * (attempt + 1));
                }
            }
            throw new IOException(Text(
                "Programmdateien konnten nicht ersetzt werden.",
                "Program files could not be replaced."), last);
        }

        private static void DeleteDirectoryWithRetry(string path)
        {
            Exception last = null;
            for (int attempt = 0; attempt < 8; attempt++)
            {
                try
                {
                    if (Directory.Exists(path))
                        Directory.Delete(path, true);
                    return;
                }
                catch (Exception ex)
                {
                    last = ex;
                    Thread.Sleep(250 * (attempt + 1));
                }
            }
            throw new IOException(Text(
                "Einige Programmdateien konnten nicht entfernt werden.",
                "Some program files could not be removed."), last);
        }

        private static void TryDeleteDirectory(string path)
        {
            if (String.IsNullOrWhiteSpace(path))
                return;
            try { DeleteDirectoryWithRetry(path); } catch { }
        }

        private static string Quote(string value)
        {
            return "\"" + value + "\"";
        }

        private static string Text(string german, string english)
        {
            return Product.IsGerman ? german : english;
        }
    }

    internal sealed class SetupWindow : Window
    {
        private Button primaryButton;
        private Button openButton;
        private Button uninstallButton;
        private Button closeButton;
        private TextBlock titleText;
        private TextBlock descriptionText;
        private TextBlock stateText;
        private TextBlock versionText;
        private TextBlock progressText;
        private TextBlock identityText;
        private TextBlock productTitleText;
        private TextBlock taglineText;
        private TextBlock motifOneText;
        private TextBlock motifTwoText;
        private TextBlock motifThreeText;
        private TextBlock localInstallText;
        private TextBlock featureOneTitle;
        private TextBlock featureOneBody;
        private TextBlock featureTwoTitle;
        private TextBlock featureTwoBody;
        private TextBlock featureThreeTitle;
        private TextBlock featureThreeBody;
        private Image logoImage;
        private Border stateDot;
        private ProgressBar progressBar;
        private CheckBox deleteDataCheckBox;
        private bool busy;
        private readonly bool preferUninstall;

        internal SetupWindow(bool preferUninstall)
        {
            this.preferUninstall = preferUninstall;
            InitializeView();
            RefreshState();
        }

        private void InitializeView()
        {
            string xaml = @"
<Window xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation'
        xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'
        Width='880' Height='560'
        WindowStartupLocation='CenterScreen'
        WindowStyle='None'
        AllowsTransparency='True'
        Background='Transparent'
        ResizeMode='NoResize'
        FontFamily='Segoe UI'
        SnapsToDevicePixels='True'>
  <Window.Resources>
    <Style x:Key='PrimaryButton' TargetType='Button'>
      <Setter Property='Height' Value='46'/>
      <Setter Property='Padding' Value='22,0'/>
      <Setter Property='Background' Value='__DARK_COLOR__'/>
      <Setter Property='Foreground' Value='White'/>
      <Setter Property='BorderThickness' Value='0'/>
      <Setter Property='FontSize' Value='14'/>
      <Setter Property='FontWeight' Value='SemiBold'/>
      <Setter Property='Cursor' Value='Hand'/>
      <Setter Property='Template'>
        <Setter.Value>
          <ControlTemplate TargetType='Button'>
            <Border x:Name='ButtonBorder'
                    Background='{TemplateBinding Background}'
                    CornerRadius='10'
                    Padding='{TemplateBinding Padding}'>
              <ContentPresenter HorizontalAlignment='Center'
                                VerticalAlignment='Center'/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property='IsMouseOver' Value='True'>
                <Setter Property='Foreground' Value='__HIGHLIGHT_COLOR__'/>
              </Trigger>
              <Trigger Property='IsEnabled' Value='False'>
                <Setter Property='Opacity' Value='.42'/>
                <Setter Property='Cursor' Value='Arrow'/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>
    <Style x:Key='SecondaryButton' TargetType='Button' BasedOn='{StaticResource PrimaryButton}'>
      <Setter Property='Background' Value='#FFFFFF'/>
      <Setter Property='Foreground' Value='__DARK_COLOR__'/>
      <Setter Property='BorderThickness' Value='1'/>
      <Setter Property='BorderBrush' Value='#DCE3EC'/>
      <Setter Property='Template'>
        <Setter.Value>
          <ControlTemplate TargetType='Button'>
            <Border Background='{TemplateBinding Background}'
                    BorderBrush='{TemplateBinding BorderBrush}'
                    BorderThickness='{TemplateBinding BorderThickness}'
                    CornerRadius='10'
                    Padding='{TemplateBinding Padding}'>
              <ContentPresenter HorizontalAlignment='Center'
                                VerticalAlignment='Center'/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property='IsMouseOver' Value='True'>
                <Setter Property='Foreground' Value='__HIGHLIGHT_COLOR__'/>
              </Trigger>
              <Trigger Property='IsEnabled' Value='False'>
                <Setter Property='Opacity' Value='.42'/>
                <Setter Property='Cursor' Value='Arrow'/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>
    <Style x:Key='TextButton' TargetType='Button'>
      <Setter Property='Height' Value='38'/>
      <Setter Property='Padding' Value='6,0'/>
      <Setter Property='Background' Value='Transparent'/>
      <Setter Property='Foreground' Value='#687487'/>
      <Setter Property='BorderThickness' Value='0'/>
      <Setter Property='FontSize' Value='13'/>
      <Setter Property='FontWeight' Value='SemiBold'/>
      <Setter Property='Cursor' Value='Hand'/>
      <Setter Property='Template'>
        <Setter.Value>
          <ControlTemplate TargetType='Button'>
            <Border Background='Transparent' Padding='{TemplateBinding Padding}'>
              <ContentPresenter HorizontalAlignment='Center'
                                VerticalAlignment='Center'/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property='IsMouseOver' Value='True'>
                <Setter Property='Foreground' Value='__HIGHLIGHT_COLOR__'/>
              </Trigger>
              <Trigger Property='IsEnabled' Value='False'>
                <Setter Property='Opacity' Value='.35'/>
                <Setter Property='Cursor' Value='Arrow'/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>
  </Window.Resources>

  <Border CornerRadius='22' Background='#F8FAFD'>
    <Border.Effect>
      <DropShadowEffect Color='#1C2A3C' BlurRadius='32' ShadowDepth='9' Opacity='.22'/>
    </Border.Effect>
    <Grid>
      <Grid.ColumnDefinitions>
        <ColumnDefinition Width='304'/>
        <ColumnDefinition Width='*'/>
      </Grid.ColumnDefinitions>

      <Border Grid.Column='0' Background='__DARK_COLOR__' CornerRadius='22,0,0,22'>
        <Grid Margin='34'>
          <Grid.RowDefinitions>
            <RowDefinition Height='Auto'/>
            <RowDefinition Height='*'/>
            <RowDefinition Height='Auto'/>
          </Grid.RowDefinitions>

          <StackPanel>
            <Border Width='58' Height='58' CornerRadius='16'
                    Background='__DARK_SURFACE_COLOR__' HorizontalAlignment='Left'
                    Padding='7'>
              <Image x:Name='LogoImage' Stretch='Uniform'/>
            </Border>
            <TextBlock x:Name='IdentityText' Margin='0,24,0,0' Foreground='#91A0B5'
                       FontSize='11' FontWeight='Bold'
                       Text='LANGUAGE LEARNING'/>
            <TextBlock x:Name='ProductTitleText' Margin='0,9,0,0' Foreground='White'
                       FontSize='29' FontWeight='SemiBold' LineHeight='35'
                       Text='Modern learning'/>
            <TextBlock x:Name='TaglineText' Margin='0,14,0,0' Foreground='#AFBBCB'
                       FontSize='13' LineHeight='20' TextWrapping='Wrap'
                       Text='A focused path from practice to automaticity.'/>
          </StackPanel>

          <Canvas Grid.Row='1' Margin='0,25,0,15' Opacity='.62'>
            <Line X1='12' Y1='52' X2='92' Y2='20' Stroke='#506078' StrokeThickness='1'/>
            <Line X1='92' Y1='20' X2='202' Y2='66' Stroke='#506078' StrokeThickness='1'/>
            <Line X1='12' Y1='52' X2='79' Y2='120' Stroke='#506078' StrokeThickness='1'/>
            <Line X1='79' Y1='120' X2='202' Y2='66' Stroke='#506078' StrokeThickness='1'/>
            <Ellipse Canvas.Left='5' Canvas.Top='45' Width='14' Height='14'
                     Fill='__HIGHLIGHT_COLOR__'/>
            <Ellipse Canvas.Left='85' Canvas.Top='13' Width='14' Height='14'
                     Fill='__ACCENT_COLOR__'/>
            <Ellipse Canvas.Left='195' Canvas.Top='59' Width='14' Height='14'
                     Fill='__SECONDARY_COLOR__'/>
            <Ellipse Canvas.Left='72' Canvas.Top='113' Width='14' Height='14'
                     Fill='#E8EDF5'/>
            <TextBlock x:Name='MotifOneText' Canvas.Left='0' Canvas.Top='68'
                       Foreground='#91A0B5' FontSize='10' Text='NOTICE'/>
            <TextBlock x:Name='MotifTwoText' Canvas.Left='78' Canvas.Top='0'
                       Foreground='#91A0B5' FontSize='10' Text='PRACTICE'/>
            <TextBlock x:Name='MotifThreeText' Canvas.Left='175' Canvas.Top='78'
                       Foreground='#91A0B5' FontSize='10' Text='SPEAK'/>
          </Canvas>

          <StackPanel Grid.Row='2'>
            <TextBlock x:Name='LocalInstallText' Foreground='#708097'
                       FontSize='11' Text='LOCAL INSTALLATION'/>
            <TextBlock x:Name='VersionText' Margin='0,6,0,0'
                       Foreground='#D9E0EA' FontSize='12'/>
          </StackPanel>
        </Grid>
      </Border>

      <Grid Grid.Column='1' Margin='44,34,38,34'>
        <Grid.RowDefinitions>
          <RowDefinition Height='Auto'/>
          <RowDefinition Height='Auto'/>
          <RowDefinition Height='*'/>
          <RowDefinition Height='Auto'/>
          <RowDefinition Height='Auto'/>
        </Grid.RowDefinitions>

        <Button x:Name='CloseButton' Grid.Row='0' Content='×'
                HorizontalAlignment='Right' VerticalAlignment='Top'
                Width='36' Height='36' Margin='0,-14,-12,0'
                Style='{StaticResource TextButton}' FontSize='22'/>

        <StackPanel Grid.Row='1' Margin='0,22,0,0'>
          <StackPanel Orientation='Horizontal'>
            <Border x:Name='StateDot' Width='9' Height='9' CornerRadius='5'
                    Background='__HIGHLIGHT_COLOR__' Margin='0,4,9,0'/>
            <TextBlock x:Name='StateText' Foreground='#536176'
                       FontSize='12' FontWeight='SemiBold'/>
          </StackPanel>
          <TextBlock x:Name='TitleText' Margin='0,13,0,0'
                     Foreground='__DARK_COLOR__' FontSize='30'
                     FontWeight='SemiBold' TextWrapping='Wrap'/>
          <TextBlock x:Name='DescriptionText' Margin='0,10,0,0'
                     Foreground='#667388' FontSize='14'
                     LineHeight='21' TextWrapping='Wrap' MaxWidth='455'
                     HorizontalAlignment='Left'/>
        </StackPanel>

        <StackPanel Grid.Row='2' Margin='0,28,0,0'>
          <Grid Margin='0,0,0,18'>
            <Grid.ColumnDefinitions>
              <ColumnDefinition Width='34'/>
              <ColumnDefinition Width='*'/>
            </Grid.ColumnDefinitions>
            <Border Width='26' Height='26' CornerRadius='8' Background='__HIGHLIGHT_SOFT_COLOR__'
                    HorizontalAlignment='Left' VerticalAlignment='Top'>
              <TextBlock Text='1' Foreground='__HIGHLIGHT_COLOR__' FontWeight='Bold'
                         HorizontalAlignment='Center' VerticalAlignment='Center'/>
            </Border>
            <StackPanel Grid.Column='1'>
              <TextBlock x:Name='FeatureOneTitle' Text='One click' Foreground='#243249'
                         FontSize='13' FontWeight='SemiBold'/>
              <TextBlock x:Name='FeatureOneBody' Text='No development tools required.'
                         Foreground='#7A8799' FontSize='12' Margin='0,3,0,0'/>
            </StackPanel>
          </Grid>
          <Grid Margin='0,0,0,18'>
            <Grid.ColumnDefinitions>
              <ColumnDefinition Width='34'/>
              <ColumnDefinition Width='*'/>
            </Grid.ColumnDefinitions>
            <Border Width='26' Height='26' CornerRadius='8' Background='__ACCENT_SOFT_COLOR__'
                    HorizontalAlignment='Left' VerticalAlignment='Top'>
              <TextBlock Text='2' Foreground='__ACCENT_COLOR__' FontWeight='Bold'
                         HorizontalAlignment='Center' VerticalAlignment='Center'/>
            </Border>
            <StackPanel Grid.Column='1'>
              <TextBlock x:Name='FeatureTwoTitle' Text='Update-safe' Foreground='#243249'
                         FontSize='13' FontWeight='SemiBold'/>
              <TextBlock x:Name='FeatureTwoBody' Text='Learning progress stays available.'
                         Foreground='#7A8799' FontSize='12' Margin='0,3,0,0'/>
            </StackPanel>
          </Grid>
          <Grid>
            <Grid.ColumnDefinitions>
              <ColumnDefinition Width='34'/>
              <ColumnDefinition Width='*'/>
            </Grid.ColumnDefinitions>
            <Border Width='26' Height='26' CornerRadius='8' Background='__SECONDARY_SOFT_COLOR__'
                    HorizontalAlignment='Left' VerticalAlignment='Top'>
              <TextBlock Text='3' Foreground='__SECONDARY_COLOR__' FontWeight='Bold'
                         HorizontalAlignment='Center' VerticalAlignment='Center'/>
            </Border>
            <StackPanel Grid.Column='1'>
              <TextBlock x:Name='FeatureThreeTitle' Text='In your control' Foreground='#243249'
                         FontSize='13' FontWeight='SemiBold'/>
              <TextBlock x:Name='FeatureThreeBody' Text='Update or remove the app at any time.'
                         Foreground='#7A8799' FontSize='12' Margin='0,3,0,0'/>
            </StackPanel>
          </Grid>
        </StackPanel>

        <StackPanel Grid.Row='3'>
          <CheckBox x:Name='DeleteDataCheckBox'
                    Margin='0,0,0,12'
                    Foreground='#667388'
                    FontSize='12'
                    Content='Also delete local learning data when uninstalling'/>
          <ProgressBar x:Name='ProgressBar' Height='5' Minimum='0' Maximum='100'
                       Background='#E3E8EF' Foreground='__HIGHLIGHT_COLOR__'
                       BorderThickness='0' Visibility='Collapsed'/>
          <TextBlock x:Name='ProgressText' Margin='0,8,0,0'
                     Foreground='#667388' FontSize='12'
                     Visibility='Collapsed'/>
        </StackPanel>

        <Grid Grid.Row='4' Margin='0,20,0,0'>
          <Grid.ColumnDefinitions>
            <ColumnDefinition Width='Auto'/>
            <ColumnDefinition Width='*'/>
            <ColumnDefinition Width='Auto'/>
            <ColumnDefinition Width='12'/>
            <ColumnDefinition Width='Auto'/>
          </Grid.ColumnDefinitions>
          <Button x:Name='UninstallButton' Grid.Column='0'
                  Content='Deinstallieren' Style='{StaticResource TextButton}'/>
          <Button x:Name='OpenButton' Grid.Column='2'
                  Content='Öffnen' Style='{StaticResource SecondaryButton}'/>
          <Button x:Name='PrimaryButton' Grid.Column='4'
                  Content='Installieren' MinWidth='142'
                  Style='{StaticResource PrimaryButton}'/>
        </Grid>
      </Grid>
    </Grid>
  </Border>
</Window>";

            Window shell = (Window)XamlReader.Parse(xaml);
            primaryButton = (Button)shell.FindName("PrimaryButton");
            openButton = (Button)shell.FindName("OpenButton");
            uninstallButton = (Button)shell.FindName("UninstallButton");
            closeButton = (Button)shell.FindName("CloseButton");
            titleText = (TextBlock)shell.FindName("TitleText");
            descriptionText = (TextBlock)shell.FindName("DescriptionText");
            stateText = (TextBlock)shell.FindName("StateText");
            versionText = (TextBlock)shell.FindName("VersionText");
            progressText = (TextBlock)shell.FindName("ProgressText");
            stateDot = (Border)shell.FindName("StateDot");
            progressBar = (ProgressBar)shell.FindName("ProgressBar");
            deleteDataCheckBox = (CheckBox)shell.FindName("DeleteDataCheckBox");
            identityText = (TextBlock)shell.FindName("IdentityText");
            productTitleText = (TextBlock)shell.FindName("ProductTitleText");
            taglineText = (TextBlock)shell.FindName("TaglineText");
            motifOneText = (TextBlock)shell.FindName("MotifOneText");
            motifTwoText = (TextBlock)shell.FindName("MotifTwoText");
            motifThreeText = (TextBlock)shell.FindName("MotifThreeText");
            localInstallText = (TextBlock)shell.FindName("LocalInstallText");
            featureOneTitle = (TextBlock)shell.FindName("FeatureOneTitle");
            featureOneBody = (TextBlock)shell.FindName("FeatureOneBody");
            featureTwoTitle = (TextBlock)shell.FindName("FeatureTwoTitle");
            featureTwoBody = (TextBlock)shell.FindName("FeatureTwoBody");
            featureThreeTitle = (TextBlock)shell.FindName("FeatureThreeTitle");
            featureThreeBody = (TextBlock)shell.FindName("FeatureThreeBody");
            logoImage = (Image)shell.FindName("LogoImage");

            ConfigureProductCopy();
            LoadEmbeddedLogo();

            object shellContent = shell.Content;
            shell.Content = null;
            Content = shellContent;
            Width = shell.Width;
            Height = shell.Height;
            WindowStartupLocation = shell.WindowStartupLocation;
            WindowStyle = shell.WindowStyle;
            AllowsTransparency = shell.AllowsTransparency;
            Background = shell.Background;
            ResizeMode = shell.ResizeMode;
            FontFamily = shell.FontFamily;

            primaryButton.Click += async (sender, args) => await InstallAsync();
            openButton.Click += (sender, args) => OpenApplication();
            uninstallButton.Click += async (sender, args) => await UninstallAsync();
            closeButton.Click += (sender, args) => Close();
            MouseLeftButtonDown += (sender, args) =>
            {
                if (args.ButtonState == MouseButtonState.Pressed)
                    DragMove();
            };
        }

        private void ConfigureProductCopy()
        {
            identityText.Text = Product.IdentityLabel;
            productTitleText.Text = Product.MarketingTitle;
            taglineText.Text = Product.Tagline;
            motifOneText.Text = Product.MotifOne;
            motifTwoText.Text = Product.MotifTwo;
            motifThreeText.Text = Product.MotifThree;
            localInstallText.Text = Text("LOKALE INSTALLATION", "LOCAL INSTALLATION");
            featureOneTitle.Text = Text("Ein Klick", "One click");
            featureOneBody.Text = Text(
                "Keine Entwicklungswerkzeuge erforderlich.",
                "No development tools required.");
            featureTwoTitle.Text = Text("Update-sicher", "Update-safe");
            featureTwoBody.Text = Text(
                "Lernfortschritt und Einstellungen bleiben erhalten.",
                "Learning progress and settings are preserved.");
            featureThreeTitle.Text = Text("Unter Ihrer Kontrolle", "In your control");
            featureThreeBody.Text = Text(
                "Aktualisieren oder deinstallieren Sie jederzeit.",
                "Update or uninstall at any time.");
            deleteDataCheckBox.Content = Text(
                "Bei Deinstallation auch lokale Lerndaten löschen",
                "Also delete local learning data when uninstalling");
            uninstallButton.Content = Text("Deinstallieren", "Uninstall");
            openButton.Content = Text("Öffnen", "Open");
        }

        private void LoadEmbeddedLogo()
        {
            Stream stream = Assembly.GetExecutingAssembly()
                .GetManifestResourceStream("AppIcon.png");
            if (stream == null)
                return;

            using (stream)
            {
                BitmapImage image = new BitmapImage();
                image.BeginInit();
                image.CacheOption = BitmapCacheOption.OnLoad;
                image.StreamSource = stream;
                image.EndInit();
                image.Freeze();
                logoImage.Source = image;
            }
        }

        private void RefreshState()
        {
            bool installed = Product.IsInstalled;
            string installedVersion = Product.InstalledVersion;

            versionText.Text = "Setup " + Product.Version;
            deleteDataCheckBox.Visibility = installed
                ? Visibility.Visible
                : Visibility.Collapsed;
            openButton.Visibility = installed
                ? Visibility.Visible
                : Visibility.Collapsed;
            uninstallButton.Visibility = installed
                ? Visibility.Visible
                : Visibility.Collapsed;

            if (!installed)
            {
                stateText.Text = Text("BEREIT ZUR INSTALLATION", "READY TO INSTALL");
                titleText.Text = Text(
                    "Lernen. Üben. Sicher anwenden.",
                    "Learn. Practise. Use it naturally.");
                descriptionText.Text = Text(
                    "Installieren Sie " + Product.Name + " mit einem Klick — ohne Terminal, Bun oder Administratorkonto.",
                    "Install " + Product.Name + " with one click — no terminal, Bun, or administrator account required.");
                primaryButton.Content = Text("Installieren", "Install");
                stateDot.Background = Brush("__HIGHLIGHT_COLOR__");
                return;
            }

            int comparison = CompareVersions(installedVersion, Product.Version);
            if (comparison < 0)
            {
                stateText.Text = Text("UPDATE VERFÜGBAR · ", "UPDATE AVAILABLE · ") +
                    installedVersion + " → " + Product.Version;
                titleText.Text = Text(
                    "Aktualisieren, ohne Fortschritt zu verlieren.",
                    "Update without losing your progress.");
                descriptionText.Text = Text(
                    "Die neue Programmversion ersetzt nur die Programmdateien. Lerndaten und Einstellungen bleiben erhalten.",
                    "The new version replaces only program files. Learning data and settings are preserved.");
                primaryButton.Content = Text("Aktualisieren", "Update");
                stateDot.Background = Brush("__ACCENT_COLOR__");
            }
            else if (comparison > 0)
            {
                stateText.Text = Text("NEUERE VERSION INSTALLIERT · ", "NEWER VERSION INSTALLED · ") +
                    installedVersion;
                titleText.Text = Text(
                    "Diese Installation ist bereits neuer.",
                    "The installed app is already newer.");
                descriptionText.Text = Text(
                    "Sie können die Anwendung öffnen oder diese ältere Setup-Version bewusst installieren.",
                    "You can open the app or deliberately install this older setup version.");
                primaryButton.Content = Text("Ältere Version installieren", "Install older version");
                stateDot.Background = Brush("__SECONDARY_COLOR__");
            }
            else
            {
                stateText.Text = Text("INSTALLIERT · VERSION ", "INSTALLED · VERSION ") +
                    installedVersion;
                titleText.Text = Product.Name + Text(" ist bereit.", " is ready.");
                descriptionText.Text = Text(
                    "Öffnen Sie die Anwendung, installieren Sie dieselbe Version erneut oder deinstallieren Sie sie kontrolliert.",
                    "Open the app, reinstall this version, or uninstall it in a controlled way.");
                primaryButton.Content = Text("Neu installieren", "Reinstall");
                stateDot.Background = Brush("__HIGHLIGHT_COLOR__");
            }

            if (preferUninstall)
                uninstallButton.Focus();
        }

        private async Task InstallAsync()
        {
            if (busy)
                return;

            if (Installer.CurrentExecutableIsInstalledCopy())
            {
                Installer.RelaunchFromTemporaryCopy("--continue-install");
                Close();
                return;
            }

            SetBusy(true);
            try
            {
                await Task.Run(() => Installer.Install(ReportProgress));
                stateText.Text = Text("INSTALLATION ABGESCHLOSSEN", "INSTALLATION COMPLETE");
                titleText.Text = Text("Bereit zum Lernen.", "Ready to learn.");
                descriptionText.Text = Text(
                    "Die Anwendung wurde eingerichtet und kann jetzt mit einem Klick geöffnet werden.",
                    "The application is installed and can now be opened with one click.");
                stateDot.Background = Brush("__HIGHLIGHT_COLOR__");
                progressText.Text = Text("Installation erfolgreich.", "Installation successful.");
                SetBusy(false);
                RefreshState();

                if (Environment.GetEnvironmentVariable(Product.EnvironmentPrefix + "_NO_LAUNCH") != "1")
                    Installer.Launch();
            }
            catch (Exception ex)
            {
                SetBusy(false);
                ShowError(ex);
                RefreshState();
            }
        }

        private async Task UninstallAsync()
        {
            if (busy || !Product.IsInstalled)
                return;

            bool deleteData = deleteDataCheckBox.IsChecked == true;
            MessageBoxResult answer = MessageBox.Show(
                deleteData
                    ? Text(
                        Product.Name + " und alle lokalen Lerndaten wirklich entfernen?",
                        "Remove " + Product.Name + " and all local learning data?")
                    : Text(
                        Product.Name + " entfernen? Lokale Lerndaten bleiben erhalten.",
                        "Remove " + Product.Name + "? Local learning data will be preserved."),
                Text(Product.Name + " deinstallieren", "Uninstall " + Product.Name),
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);
            if (answer != MessageBoxResult.Yes)
                return;

            if (Installer.CurrentExecutableIsInstalledCopy())
            {
                string argument = deleteData
                    ? "--perform-uninstall --delete-data --show-result"
                    : "--perform-uninstall --show-result";
                Installer.RelaunchFromTemporaryCopy(argument);
                Close();
                return;
            }

            SetBusy(true);
            try
            {
                await Task.Run(() => Installer.Uninstall(deleteData, ReportProgress));
                SetBusy(false);
                stateText.Text = Text("DEINSTALLATION ABGESCHLOSSEN", "UNINSTALL COMPLETE");
                titleText.Text = Text("Anwendung wurde entfernt.", "The application was removed.");
                descriptionText.Text = deleteData
                    ? Text(
                        "Programm und lokale Lerndaten wurden gelöscht.",
                        "Program files and local learning data were deleted.")
                    : Text(
                        "Die Programmdateien wurden entfernt. Lerndaten bleiben für eine spätere Installation erhalten.",
                        "Program files were removed. Learning data remains available for a later installation.");
                stateDot.Background = Brush("__HIGHLIGHT_COLOR__");
                RefreshState();
            }
            catch (Exception ex)
            {
                SetBusy(false);
                ShowError(ex);
                RefreshState();
            }
        }

        private void OpenApplication()
        {
            try
            {
                Installer.Launch();
                Close();
            }
            catch (Exception ex)
            {
                ShowError(ex);
            }
        }

        private void ReportProgress(int value, string message)
        {
            Dispatcher.Invoke(() =>
            {
                progressBar.Value = Math.Max(0, Math.Min(100, value));
                progressText.Text = message;
            });
        }

        private void SetBusy(bool value)
        {
            busy = value;
            primaryButton.IsEnabled = !value;
            openButton.IsEnabled = !value;
            uninstallButton.IsEnabled = !value;
            closeButton.IsEnabled = !value;
            deleteDataCheckBox.IsEnabled = !value;
            progressBar.Visibility = value ? Visibility.Visible : Visibility.Collapsed;
            progressText.Visibility = value ? Visibility.Visible : Visibility.Collapsed;
            if (value)
            {
                progressBar.Value = 2;
                progressText.Text = Text("Vorgang wird vorbereitet …", "Preparing …");
            }
        }

        private static int CompareVersions(string left, string right)
        {
            Version leftVersion;
            Version rightVersion;
            if (!Version.TryParse(left, out leftVersion))
                leftVersion = new Version(0, 0);
            if (!Version.TryParse(right, out rightVersion))
                rightVersion = new Version(0, 0);
            return leftVersion.CompareTo(rightVersion);
        }

        private static Brush Brush(string color)
        {
            return new SolidColorBrush((Color)ColorConverter.ConvertFromString(color));
        }

        private void ShowError(Exception exception)
        {
            string message = exception.GetBaseException().Message;
            MessageBox.Show(
                message,
                Product.Name + " Setup",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }

        private static string Text(string german, string english)
        {
            return Product.IsGerman ? german : english;
        }
    }

    internal static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            bool silentInstall = HasArgument(args, "--silent-install");
            bool silentUninstall = HasArgument(args, "--silent-uninstall");
            bool performUninstall = HasArgument(args, "--perform-uninstall");
            bool deleteData = HasArgument(args, "--delete-data");
            bool showResult = HasArgument(args, "--show-result");

            try
            {
                if (silentInstall)
                {
                    Installer.Install((value, message) => { });
                    return 0;
                }

                if (silentUninstall || performUninstall)
                {
                    Installer.Uninstall(deleteData, (value, message) => { });
                    if (performUninstall)
                        Installer.ScheduleSelfDelete();
                    if (showResult)
                    {
                        MessageBox.Show(
                            deleteData
                                ? Text(
                                    Product.Name + " und lokale Lerndaten wurden entfernt.",
                                    Product.Name + " and local learning data were removed.")
                                : Text(
                                    Product.Name + " wurde entfernt. Lokale Lerndaten wurden beibehalten.",
                                    Product.Name + " was removed. Local learning data was preserved."),
                            Text("Deinstallation abgeschlossen", "Uninstall complete"),
                            MessageBoxButton.OK,
                            MessageBoxImage.Information);
                    }
                    return 0;
                }

                bool preferUninstall = HasArgument(args, "--uninstall");
                Application application = new Application
                {
                    ShutdownMode = ShutdownMode.OnMainWindowClose
                };
                SetupWindow window = new SetupWindow(preferUninstall);

                if (HasArgument(args, "--continue-install"))
                {
                    window.Loaded += async (sender, eventArgs) =>
                    {
                        MethodInfo method = typeof(SetupWindow).GetMethod(
                            "InstallAsync",
                            BindingFlags.Instance | BindingFlags.NonPublic);
                        Task task = (Task)method.Invoke(window, null);
                        await task;
                    };
                }

                application.Run(window);
                return 0;
            }
            catch (Exception ex)
            {
                try
                {
                    Directory.CreateDirectory(Product.DataRoot);
                    File.WriteAllText(
                        Path.Combine(Product.DataRoot, "setup-error.log"),
                        ex.ToString(),
                        Encoding.UTF8);
                }
                catch { }

                if (!silentInstall && !silentUninstall)
                {
                    MessageBox.Show(
                        ex.GetBaseException().Message,
                        Product.Name + " Setup",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error);
                }
                return 1;
            }
        }

        private static bool HasArgument(string[] args, string expected)
        {
            foreach (string arg in args)
            {
                if (String.Equals(arg, expected, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }

        private static string Text(string german, string english)
        {
            return Product.IsGerman ? german : english;
        }
    }
}
