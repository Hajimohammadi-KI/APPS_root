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

[assembly: AssemblyTitle("Study Tracker Setup")]
[assembly: AssemblyDescription("Modern one-click setup, update, and uninstall manager")]
[assembly: AssemblyCompany("Evidence-first Research OS")]
[assembly: AssemblyProduct("Study Tracker")]
[assembly: AssemblyVersion("__VERSION__")]
[assembly: AssemblyFileVersion("__VERSION__")]

namespace CrciResearchOsSetup
{
    internal static class Product
    {
        internal const string Name = "Study Tracker";
        internal const string LegacyName = "CRCI Research OS";
        internal const string Version = "__VERSION__";
        internal const string Publisher = "Evidence-first Research OS";
        internal const string ProductId = "CRCIResearchOS";

        internal static readonly string InstallRoot =
            Environment.GetEnvironmentVariable("CRCI_INSTALL_ROOT") ??
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs",
                LegacyName);

        internal static readonly string DataRoot =
            Environment.GetEnvironmentVariable("CRCI_DATA_ROOT") ??
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                LegacyName);

        internal static string CurrentExecutable
        {
            get { return Assembly.GetExecutingAssembly().Location; }
        }

        internal static string InstalledSetup
        {
            get { return Path.Combine(InstallRoot, "Study-Tracker-Setup.exe"); }
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
                return File.Exists(Path.Combine(InstallRoot, "runtime", "bun.exe")) &&
                       File.Exists(Path.Combine(InstallRoot, "web", "apps", "web", "server.js")) &&
                       File.Exists(Path.Combine(InstallRoot, "api", "main.js"));
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
            Path.Combine("runtime", "bun.exe"),
            Path.Combine("api", "main.js"),
            Path.Combine("web", "apps", "web", "server.js"),
            "launcher.ps1",
            "launcher.vbs",
            "google-oauth.json",
            "version.txt"
        };

        internal static bool Install(
            bool firstTimeOnly,
            Action<int, string> progress)
        {
            if (firstTimeOnly && Product.IsInstalled)
            {
                progress(100,
                    "Bereits installiert. Es wurde keine zweite Installation erstellt.");
                return false;
            }

            if (!firstTimeOnly && !Product.IsInstalled)
                throw new InvalidOperationException(
                    "Die Anwendung ist nicht installiert. Wählen Sie zuerst die Erstinstallation.");

            string parent = Path.GetDirectoryName(Product.InstallRoot);
            if (String.IsNullOrWhiteSpace(parent))
                throw new InvalidOperationException("Der Installationspfad ist ungültig.");

            Directory.CreateDirectory(parent);
            Directory.CreateDirectory(Product.DataRoot);

            string staging = Path.Combine(
                parent,
                ".crci-i-" + Guid.NewGuid().ToString("N").Substring(0, 8));
            string backup = Path.Combine(
                parent,
                ".crci-b-" + Guid.NewGuid().ToString("N").Substring(0, 8));

            try
            {
                progress(8, "Installationspaket wird geprüft …");
                Directory.CreateDirectory(staging);
                ExtractPayload(staging, progress);
                VerifyPayload(staging);

                progress(62, "Vorhandene Prozesse werden beendet …");
                StopInstalledProcesses();

                File.Copy(
                    Product.CurrentExecutable,
                    Path.Combine(staging, "Study-Tracker-Setup.exe"),
                    true);

                bool hadPreviousInstall = Directory.Exists(Product.InstallRoot);
                if (hadPreviousInstall)
                {
                    progress(70, "Vorhandene Version wird sicher aktualisiert …");
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

                progress(82, "Verknüpfungen werden eingerichtet …");
                CreateShortcuts();
                RegisterUninstallEntry();

                progress(94, "Installation wird abgeschlossen …");
                TryDeleteDirectory(backup);
                progress(100, "Study Tracker ist bereit.");
                return true;
            }
            catch
            {
                TryDeleteDirectory(staging);
                throw;
            }
        }

        internal static void Uninstall(bool deleteData, Action<int, string> progress)
        {
            progress(12, "Anwendung wird beendet …");
            StopInstalledProcesses();

            progress(35, "Verknüpfungen werden entfernt …");
            RemoveShortcuts();
            RemoveUninstallEntry();

            progress(62, "Programmdateien werden entfernt …");
            if (Directory.Exists(Product.InstallRoot))
                DeleteDirectoryWithRetry(Product.InstallRoot);

            if (deleteData && Directory.Exists(Product.DataRoot))
            {
                progress(82, "Lokale Forschungsdaten werden entfernt …");
                DeleteDirectoryWithRetry(Product.DataRoot);
            }

            progress(100, deleteData
                ? "Anwendung und lokale Daten wurden entfernt."
                : "Anwendung entfernt. Lokale Daten wurden beibehalten.");
        }

        internal static void Launch(bool openBrowser = true)
        {
            if (String.Equals(
                Environment.GetEnvironmentVariable("CRCI_NO_LAUNCH"),
                "1",
                StringComparison.Ordinal))
                return;

            string launcher = Path.Combine(Product.InstallRoot, "launcher.vbs");
            if (!File.Exists(launcher))
                throw new FileNotFoundException("Die Anwendung ist nicht vollständig installiert.", launcher);

            ProcessStartInfo info = new ProcessStartInfo
            {
                FileName = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.Windows),
                    "System32",
                    "wscript.exe"),
                Arguments = Quote(launcher),
                WorkingDirectory = Product.InstallRoot,
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            if (!openBrowser)
                info.EnvironmentVariables["CRCI_NO_BROWSER"] = "1";
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
                "Study-Tracker-Setup-" + Guid.NewGuid().ToString("N") + ".exe");
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
                throw new InvalidDataException("Das eingebettete Installationspaket fehlt.");

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
                        throw new InvalidDataException("Das Installationspaket enthält einen ungültigen Pfad.");

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
                        progress(value, "Programmdateien werden vorbereitet …");
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
                        "Das Installationspaket ist unvollständig: " + relative);
            }
        }

        private static void StopInstalledProcesses()
        {
            string runRoot = Path.Combine(Product.DataRoot, "run");
            StopProcessFromPidFile(Path.Combine(runRoot, "api.pid"));
            StopProcessFromPidFile(Path.Combine(runRoot, "web.pid"));

            // A previous crash or launcher race can leave an untracked Bun
            // process behind after its PID file has disappeared. Stop only
            // processes whose executable is this product's embedded runtime.
            string expectedRuntime = Path.GetFullPath(
                Path.Combine(Product.InstallRoot, "runtime", "bun.exe"));
            foreach (Process process in Process.GetProcessesByName("bun"))
            {
                try
                {
                    string actualRuntime = Path.GetFullPath(
                        process.MainModule.FileName);
                    if (!String.Equals(
                        expectedRuntime,
                        actualRuntime,
                        StringComparison.OrdinalIgnoreCase))
                        continue;

                    process.Kill();
                    process.WaitForExit(5000);
                }
                catch
                {
                    // Other Bun applications and processes that already
                    // exited are deliberately left untouched.
                }
                finally
                {
                    process.Dispose();
                }
            }
            Thread.Sleep(350);
        }

        private static void StopProcessFromPidFile(string pidFile)
        {
            try
            {
                if (!File.Exists(pidFile))
                    return;

                int pid;
                if (!Int32.TryParse(File.ReadAllText(pidFile).Trim(), out pid))
                    return;

                Process process = Process.GetProcessById(pid);
                string expectedRuntime = Path.GetFullPath(
                    Path.Combine(Product.InstallRoot, "runtime", "bun.exe"));
                string actualRuntime = Path.GetFullPath(process.MainModule.FileName);

                if (String.Equals(
                    expectedRuntime,
                    actualRuntime,
                    StringComparison.OrdinalIgnoreCase))
                {
                    process.Kill();
                    process.WaitForExit(5000);
                }
            }
            catch
            {
                // A stale PID or an already closed process is safe to ignore.
            }
            finally
            {
                try { File.Delete(pidFile); } catch { }
            }
        }

        private static void CreateShortcuts()
        {
            if (Environment.GetEnvironmentVariable("CRCI_NO_SHORTCUTS") == "1")
                return;

            string startMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Microsoft",
                "Windows",
                "Start Menu",
                "Programs",
                Product.Name);
            RemoveLegacyShortcuts();
            Directory.CreateDirectory(startMenu);

            string icon = Path.Combine(Product.InstallRoot, "app.ico");
            string launcher = Path.Combine(Product.InstallRoot, "launcher.vbs");
            string wscript = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Windows),
                "System32",
                "wscript.exe");

            CreateShortcut(
                Path.Combine(startMenu, Product.Name + ".lnk"),
                wscript,
                Quote(launcher),
                Product.InstallRoot,
                icon,
                "Study Tracker öffnen");

            CreateShortcut(
                Path.Combine(startMenu, "Study Tracker verwalten oder deinstallieren.lnk"),
                Product.InstalledSetup,
                "",
                Product.InstallRoot,
                icon,
                "Installation aktualisieren oder entfernen");

            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            CreateShortcut(
                Path.Combine(desktop, Product.Name + ".lnk"),
                wscript,
                Quote(launcher),
                Product.InstallRoot,
                icon,
                "Study Tracker öffnen");
        }

        private static void RemoveShortcuts()
        {
            if (Environment.GetEnvironmentVariable("CRCI_NO_SHORTCUTS") == "1")
                return;

            string startMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Microsoft",
                "Windows",
                "Start Menu",
                "Programs",
                Product.Name);
            TryDeleteDirectory(startMenu);

            string desktopShortcut = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                Product.Name + ".lnk");
            try { File.Delete(desktopShortcut); } catch { }
            RemoveLegacyShortcuts();
        }

        private static void RemoveLegacyShortcuts()
        {
            string legacyStartMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Microsoft",
                "Windows",
                "Start Menu",
                "Programs",
                Product.LegacyName);
            TryDeleteDirectory(legacyStartMenu);

            string legacyDesktopShortcut = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                Product.LegacyName + ".lnk");
            try { File.Delete(legacyDesktopShortcut); } catch { }
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
            if (Environment.GetEnvironmentVariable("CRCI_NO_SHORTCUTS") == "1")
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
            if (Environment.GetEnvironmentVariable("CRCI_NO_SHORTCUTS") == "1")
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
            throw new IOException("Programmdateien konnten nicht ersetzt werden.", last);
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
            throw new IOException("Einige Programmdateien konnten nicht entfernt werden.", last);
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
    }

    internal enum SetupOperation
    {
        None,
        Install,
        Update,
        Repair,
        Uninstall
    }

    internal static class OperationPicker
    {
        internal static SetupOperation Show(Window owner, SetupOperation preferred)
        {
            bool installed = Product.IsInstalled;
            string installedVersion = Product.InstalledVersion;
            SetupOperation selected = SetupOperation.None;

            Window dialog = new Window
            {
                Owner = owner,
                Width = 610,
                Height = 570,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
                WindowStyle = WindowStyle.None,
                AllowsTransparency = true,
                Background = Brushes.Transparent,
                ResizeMode = ResizeMode.NoResize,
                ShowInTaskbar = false,
                FontFamily = new FontFamily("Segoe UI"),
                Title = "Setup-Aktion auswählen"
            };

            Border shell = new Border
            {
                Background = Brush("#F8FAFD"),
                BorderBrush = Brush("#DCE3EC"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(22),
                Padding = new Thickness(34, 30, 34, 30),
                Effect = new System.Windows.Media.Effects.DropShadowEffect
                {
                    Color = (Color)ColorConverter.ConvertFromString("#1C2A3C"),
                    BlurRadius = 32,
                    ShadowDepth = 9,
                    Opacity = .22
                }
            };
            dialog.Content = shell;

            Grid layout = new Grid();
            layout.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            layout.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            layout.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            layout.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            shell.Child = layout;

            Grid header = new Grid();
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            Grid.SetRow(header, 0);
            layout.Children.Add(header);

            StackPanel heading = new StackPanel();
            heading.Children.Add(new TextBlock
            {
                Text = "SETUP-MODUS",
                Foreground = Brush("#17A673"),
                FontSize = 11,
                FontWeight = FontWeights.Bold
            });
            heading.Children.Add(new TextBlock
            {
                Text = "Was möchten Sie tun?",
                Foreground = Brush("#17243A"),
                FontSize = 28,
                FontWeight = FontWeights.SemiBold,
                Margin = new Thickness(0, 8, 0, 0)
            });
            header.Children.Add(heading);

            Button close = new Button
            {
                Content = "×",
                Width = 38,
                Height = 38,
                Background = Brushes.Transparent,
                Foreground = Brush("#687487"),
                BorderThickness = new Thickness(0),
                FontSize = 22,
                Cursor = Cursors.Hand,
                ToolTip = "Setup schließen"
            };
            close.Click += delegate { dialog.Close(); };
            close.MouseEnter += delegate { close.Foreground = Brush("#17A673"); };
            close.MouseLeave += delegate { close.Foreground = Brush("#687487"); };
            Grid.SetColumn(close, 1);
            header.Children.Add(close);

            TextBlock status = new TextBlock
            {
                Text = installed
                    ? "Installiert: Version " + installedVersion +
                      ". Update, Reparatur oder Deinstallation wählen."
                    : "Noch nicht installiert. Wählen Sie die Erstinstallation.",
                Foreground = Brush("#667388"),
                FontSize = 13,
                LineHeight = 20,
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 14, 0, 20)
            };
            Grid.SetRow(status, 1);
            layout.Children.Add(status);

            StackPanel choices = new StackPanel();
            Grid.SetRow(choices, 2);
            layout.Children.Add(choices);

            Button installButton = CreateChoice(
                "Erstinstallation",
                installed
                    ? "Bereits installiert — eine zweite Kopie wird nicht erstellt."
                    : "Installiert Study Tracker samt Laufzeit und Verknüpfungen. Slack oder andere Zusatzsoftware sind nicht nötig.",
                !installed);
            Button updateButton = CreateChoice(
                "Aktualisieren",
                installed
                    ? "Installiert Setup " + Product.Version +
                      "; Forschungsdaten bleiben erhalten."
                    : "Nach der Erstinstallation verfügbar.",
                installed);
            Button repairButton = CreateChoice(
                "Reparieren",
                installed
                    ? "Installiert Programmdateien neu; Forschungsdaten bleiben erhalten."
                    : "Nach der Erstinstallation verfügbar.",
                installed);
            Button uninstallButton = CreateChoice(
                "Deinstallieren",
                installed
                    ? "Entfernt die App; lokale Forschungsdaten sind optional."
                    : "Die App ist noch nicht installiert.",
                installed);

            choices.Children.Add(installButton);
            choices.Children.Add(updateButton);
            choices.Children.Add(repairButton);
            choices.Children.Add(uninstallButton);

            installButton.Click += delegate
            {
                selected = SetupOperation.Install;
                dialog.DialogResult = true;
            };
            updateButton.Click += delegate
            {
                selected = SetupOperation.Update;
                dialog.DialogResult = true;
            };
            repairButton.Click += delegate
            {
                selected = SetupOperation.Repair;
                dialog.DialogResult = true;
            };
            uninstallButton.Click += delegate
            {
                selected = SetupOperation.Uninstall;
                dialog.DialogResult = true;
            };

            TextBlock note = new TextBlock
            {
                Text = "Es wird noch nichts geändert. Die gewählte Aktion wird zuerst erklärt und bestätigt.",
                Foreground = Brush("#7A8799"),
                FontSize = 11,
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 16, 0, 0)
            };
            Grid.SetRow(note, 3);
            layout.Children.Add(note);

            dialog.KeyDown += delegate(object sender, KeyEventArgs args)
            {
                if (args.Key == Key.Escape)
                    dialog.Close();
            };
            dialog.Loaded += delegate
            {
                Button target = preferred == SetupOperation.Uninstall && uninstallButton.IsEnabled
                    ? uninstallButton
                    : preferred == SetupOperation.Update && updateButton.IsEnabled
                        ? updateButton
                        : preferred == SetupOperation.Repair && repairButton.IsEnabled
                            ? repairButton
                            : installButton.IsEnabled
                                ? installButton
                                : updateButton;
                target.Focus();
            };
            dialog.MouseLeftButtonDown += delegate(object sender, MouseButtonEventArgs args)
            {
                if (args.ButtonState == MouseButtonState.Pressed)
                    dialog.DragMove();
            };

            dialog.ShowDialog();
            return selected;
        }

        private static Button CreateChoice(string title, string description, bool enabled)
        {
            Button button = new Button
            {
                Height = 76,
                Margin = new Thickness(0, 0, 0, 10),
                Padding = new Thickness(18, 10, 18, 10),
                Background = Brushes.White,
                Foreground = Brush("#17243A"),
                BorderBrush = Brush("#DCE3EC"),
                BorderThickness = new Thickness(1),
                HorizontalContentAlignment = HorizontalAlignment.Stretch,
                Cursor = enabled ? Cursors.Hand : Cursors.Arrow,
                IsEnabled = enabled,
                Opacity = enabled ? 1 : .48,
                Template = (ControlTemplate)XamlReader.Parse(@"
<ControlTemplate xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation'
                 TargetType='Button'>
  <Border Background='{TemplateBinding Background}'
          BorderBrush='{TemplateBinding BorderBrush}'
          BorderThickness='{TemplateBinding BorderThickness}'
          CornerRadius='12'
          Padding='{TemplateBinding Padding}'>
    <ContentPresenter HorizontalAlignment='{TemplateBinding HorizontalContentAlignment}'
                      VerticalAlignment='Center'/>
  </Border>
  <ControlTemplate.Triggers>
    <Trigger Property='IsMouseOver' Value='True'>
      <Setter Property='Foreground' Value='#17A673'/>
    </Trigger>
  </ControlTemplate.Triggers>
</ControlTemplate>")
            };

            StackPanel content = new StackPanel();
            content.Children.Add(new TextBlock
            {
                Text = title,
                FontSize = 14,
                FontWeight = FontWeights.SemiBold
            });
            content.Children.Add(new TextBlock
            {
                Text = description,
                Foreground = Brush("#738095"),
                FontSize = 11.5,
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 4, 0, 0)
            });
            button.Content = content;
            button.ToolTip = title + ". " + description;
            System.Windows.Automation.AutomationProperties.SetName(button, title);
            System.Windows.Automation.AutomationProperties.SetHelpText(
                button,
                description);
            return button;
        }

        private static Brush Brush(string color)
        {
            return new SolidColorBrush((Color)ColorConverter.ConvertFromString(color));
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
        private Border stateDot;
        private ProgressBar progressBar;
        private CheckBox deleteDataCheckBox;
        private bool busy;
        private SetupOperation selectedOperation;

        internal SetupWindow(SetupOperation initialOperation)
        {
            selectedOperation = initialOperation;
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
      <Setter Property='Background' Value='#17243A'/>
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
                <Setter Property='Foreground' Value='#2ED38F'/>
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
      <Setter Property='Foreground' Value='#17243A'/>
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
                <Setter Property='Foreground' Value='#17A673'/>
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
                <Setter Property='Foreground' Value='#17A673'/>
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

      <Border Grid.Column='0' Background='#17243A' CornerRadius='22,0,0,22'>
        <Grid Margin='34'>
          <Grid.RowDefinitions>
            <RowDefinition Height='Auto'/>
            <RowDefinition Height='*'/>
            <RowDefinition Height='Auto'/>
          </Grid.RowDefinitions>

          <StackPanel>
            <Border Width='46' Height='46' CornerRadius='13'
                    Background='#20334D' HorizontalAlignment='Left'>
              <Grid>
                <Ellipse Width='8' Height='8' Fill='#2ED38F'
                         HorizontalAlignment='Left' VerticalAlignment='Top'
                         Margin='11,11,0,0'/>
                <Ellipse Width='8' Height='8' Fill='#7586FF'
                         HorizontalAlignment='Right' VerticalAlignment='Top'
                         Margin='0,11,11,0'/>
                <Ellipse Width='8' Height='8' Fill='#20B8D5'
                         HorizontalAlignment='Center' VerticalAlignment='Bottom'
                         Margin='0,0,0,10'/>
                <Path Stroke='#AAB7C8' StrokeThickness='1'
                      Data='M 15,15 L 31,15 M 15,17 L 23,32 M 31,17 L 23,32'/>
              </Grid>
            </Border>
            <TextBlock Margin='0,24,0,0' Foreground='#91A0B5'
                       FontSize='11' FontWeight='Bold'
                       Text='EVIDENCE-FIRST'/>
            <TextBlock Margin='0,9,0,0' Foreground='White'
                       FontSize='29' FontWeight='SemiBold' LineHeight='35'
                       Text='Study&#x0a;Tracker'/>
            <TextBlock Margin='0,14,0,0' Foreground='#AFBBCB'
                       FontSize='13' LineHeight='20' TextWrapping='Wrap'
                       Text='Cross-repository code intelligence für nachvollziehbare Forschungsarbeit.'/>
          </StackPanel>

          <Canvas Grid.Row='1' Margin='0,25,0,15' Opacity='.62'>
            <Line X1='12' Y1='52' X2='92' Y2='20' Stroke='#506078' StrokeThickness='1'/>
            <Line X1='92' Y1='20' X2='202' Y2='66' Stroke='#506078' StrokeThickness='1'/>
            <Line X1='12' Y1='52' X2='79' Y2='120' Stroke='#506078' StrokeThickness='1'/>
            <Line X1='79' Y1='120' X2='202' Y2='66' Stroke='#506078' StrokeThickness='1'/>
            <Ellipse Canvas.Left='5' Canvas.Top='45' Width='14' Height='14'
                     Fill='#2ED38F'/>
            <Ellipse Canvas.Left='85' Canvas.Top='13' Width='14' Height='14'
                     Fill='#7586FF'/>
            <Ellipse Canvas.Left='195' Canvas.Top='59' Width='14' Height='14'
                     Fill='#20B8D5'/>
            <Ellipse Canvas.Left='72' Canvas.Top='113' Width='14' Height='14'
                     Fill='#E8EDF5'/>
            <TextBlock Canvas.Left='0' Canvas.Top='68' Foreground='#91A0B5'
                       FontSize='10' Text='CODE'/>
            <TextBlock Canvas.Left='78' Canvas.Top='0' Foreground='#91A0B5'
                       FontSize='10' Text='EVIDENZ'/>
            <TextBlock Canvas.Left='175' Canvas.Top='78' Foreground='#91A0B5'
                       FontSize='10' Text='INSIGHT'/>
          </Canvas>

          <StackPanel Grid.Row='2'>
            <TextBlock Foreground='#708097' FontSize='11' Text='LOKALE INSTALLATION'/>
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
                    Background='#17A673' Margin='0,4,9,0'/>
            <TextBlock x:Name='StateText' Foreground='#536176'
                       FontSize='12' FontWeight='SemiBold'/>
          </StackPanel>
          <TextBlock x:Name='TitleText' Margin='0,13,0,0'
                     Foreground='#17243A' FontSize='30'
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
            <Border Width='26' Height='26' CornerRadius='8' Background='#E8F8F1'
                    HorizontalAlignment='Left' VerticalAlignment='Top'>
              <TextBlock Text='1' Foreground='#13845D' FontWeight='Bold'
                         HorizontalAlignment='Center' VerticalAlignment='Center'/>
            </Border>
            <StackPanel Grid.Column='1'>
              <TextBlock Text='Ein Klick' Foreground='#243249'
                         FontSize='13' FontWeight='SemiBold'/>
              <TextBlock Text='Keine Entwicklungswerkzeuge erforderlich.'
                         Foreground='#7A8799' FontSize='12' Margin='0,3,0,0'/>
            </StackPanel>
          </Grid>
          <Grid Margin='0,0,0,18'>
            <Grid.ColumnDefinitions>
              <ColumnDefinition Width='34'/>
              <ColumnDefinition Width='*'/>
            </Grid.ColumnDefinitions>
            <Border Width='26' Height='26' CornerRadius='8' Background='#EEF0FF'
                    HorizontalAlignment='Left' VerticalAlignment='Top'>
              <TextBlock Text='2' Foreground='#5965D9' FontWeight='Bold'
                         HorizontalAlignment='Center' VerticalAlignment='Center'/>
            </Border>
            <StackPanel Grid.Column='1'>
              <TextBlock Text='Update-sicher' Foreground='#243249'
                         FontSize='13' FontWeight='SemiBold'/>
              <TextBlock Text='Lokale Forschungsdaten bleiben erhalten.'
                         Foreground='#7A8799' FontSize='12' Margin='0,3,0,0'/>
            </StackPanel>
          </Grid>
          <Grid>
            <Grid.ColumnDefinitions>
              <ColumnDefinition Width='34'/>
              <ColumnDefinition Width='*'/>
            </Grid.ColumnDefinitions>
            <Border Width='26' Height='26' CornerRadius='8' Background='#E7F6FA'
                    HorizontalAlignment='Left' VerticalAlignment='Top'>
              <TextBlock Text='3' Foreground='#14849C' FontWeight='Bold'
                         HorizontalAlignment='Center' VerticalAlignment='Center'/>
            </Border>
            <StackPanel Grid.Column='1'>
              <TextBlock Text='Kontrollierbar' Foreground='#243249'
                         FontSize='13' FontWeight='SemiBold'/>
              <TextBlock Text='Installation und Entfernung jederzeit verfügbar.'
                         Foreground='#7A8799' FontSize='12' Margin='0,3,0,0'/>
            </StackPanel>
          </Grid>
        </StackPanel>

        <StackPanel Grid.Row='3'>
          <CheckBox x:Name='DeleteDataCheckBox'
                    Margin='0,0,0,12'
                    Foreground='#667388'
                    FontSize='12'
                    Content='Bei Deinstallation auch lokale Forschungsdaten löschen'/>
          <ProgressBar x:Name='ProgressBar' Height='5' Minimum='0' Maximum='100'
                       Background='#E3E8EF' Foreground='#17A673'
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

            primaryButton.Click += async (sender, args) =>
                await ExecuteSelectedOperationAsync();
            openButton.Click += (sender, args) => OpenApplication();
            uninstallButton.Click += async (sender, args) => await UninstallAsync();
            closeButton.Click += (sender, args) => Close();
            MouseLeftButtonDown += (sender, args) =>
            {
                if (args.ButtonState == MouseButtonState.Pressed)
                    DragMove();
            };
        }

        private void RefreshState()
        {
            bool installed = Product.IsInstalled;
            string installedVersion = Product.InstalledVersion;

            versionText.Text = "Setup " + Product.Version;
            deleteDataCheckBox.Visibility =
                installed && selectedOperation == SetupOperation.Uninstall
                ? Visibility.Visible
                : Visibility.Collapsed;
            openButton.Visibility = installed
                ? Visibility.Visible
                : Visibility.Collapsed;
            uninstallButton.Visibility = Visibility.Collapsed;

            bool operationAvailable =
                selectedOperation == SetupOperation.Install
                    ? !installed
                    : selectedOperation == SetupOperation.Update ||
                      selectedOperation == SetupOperation.Repair ||
                      selectedOperation == SetupOperation.Uninstall
                        ? installed
                        : false;
            primaryButton.IsEnabled = !busy && operationAvailable;

            if (!operationAvailable)
            {
                selectedOperation = SetupOperation.None;
                stateText.Text = installed
                    ? "INSTALLIERT · VERSION " + installedVersion
                    : "NICHT INSTALLIERT";
                titleText.Text = "Wählen Sie zuerst eine Aktion.";
                descriptionText.Text =
                    "Im Auswahlfenster entscheiden Sie zwischen Erstinstallation, Update, Reparatur und Deinstallation.";
                primaryButton.Content = "Aktion auswählen";
                stateDot.Background = Brush("#17A673");
                return;
            }

            if (selectedOperation == SetupOperation.Install)
            {
                stateText.Text = "ERSTINSTALLATION AUSGEWÄHLT";
                titleText.Text = "Research OS vollständig installieren.";
                descriptionText.Text =
                    "Study Tracker wird lokal eingerichtet. Google Calendar ist vorbereitet; Bun, Terminal oder ein Administratorkonto sind nicht erforderlich.";
                primaryButton.Content = "Jetzt installieren";
                stateDot.Background = Brush("#17A673");
            }
            else if (selectedOperation == SetupOperation.Update)
            {
                stateText.Text = "UPDATE AUSGEWÄHLT · " + installedVersion + " → " + Product.Version;
                titleText.Text = "Programmdateien aktualisieren.";
                descriptionText.Text =
                    "Die Version aus diesem Setup ersetzt die vorhandenen Programmdateien. Forschungsdaten und Fortschritt bleiben erhalten.";
                primaryButton.Content = "Update ausführen";
                stateDot.Background = Brush("#7586FF");
            }
            else if (selectedOperation == SetupOperation.Repair)
            {
                stateText.Text = "REPARATUR AUSGEWÄHLT · VERSION " + installedVersion;
                titleText.Text = "Installation reparieren.";
                descriptionText.Text =
                    "Alle Programmdateien werden aus diesem Setup neu installiert. Lokale Forschungsdaten und Einstellungen werden nicht gelöscht.";
                primaryButton.Content = "Reparatur ausführen";
                stateDot.Background = Brush("#20B8D5");
            }
            else
            {
                stateText.Text = "DEINSTALLATION AUSGEWÄHLT · VERSION " + installedVersion;
                titleText.Text = "Research OS kontrolliert entfernen.";
                descriptionText.Text =
                    "Die Programmdateien werden entfernt. Aktivieren Sie die Option unten nur, wenn auch alle lokalen Forschungsdaten gelöscht werden sollen.";
                primaryButton.Content = "Deinstallation prüfen";
                stateDot.Background = Brush("#17A673");
            }
        }

        internal void SelectOperation(SetupOperation operation)
        {
            selectedOperation = operation;
            RefreshState();
            if (primaryButton.IsEnabled)
                primaryButton.Focus();
        }

        private async Task ExecuteSelectedOperationAsync()
        {
            if (selectedOperation == SetupOperation.Uninstall)
                await UninstallAsync();
            else if (selectedOperation != SetupOperation.None)
                await InstallAsync();
        }

        private async Task InstallAsync()
        {
            if (busy ||
                selectedOperation == SetupOperation.None ||
                selectedOperation == SetupOperation.Uninstall)
                return;

            if (Installer.CurrentExecutableIsInstalledCopy())
            {
                Installer.RelaunchFromTemporaryCopy(
                    "--continue-install --operation=" +
                    selectedOperation.ToString().ToLowerInvariant());
                Close();
                return;
            }

            SetupOperation completedOperation = selectedOperation;
            SetBusy(true);
            try
            {
                bool installedNow = await Task.Run(() => Installer.Install(
                    completedOperation == SetupOperation.Install,
                    ReportProgress));
                if (!installedNow)
                {
                    selectedOperation = SetupOperation.Repair;
                    SetBusy(false);
                    RefreshState();
                    stateText.Text = "BEREITS INSTALLIERT";
                    titleText.Text = "Eine Installation ist bereits vorhanden.";
                    descriptionText.Text =
                        "Es wurde keine zweite Kopie erstellt. Verwenden Sie Aktualisieren, Reparieren oder Deinstallieren.";
                    stateDot.Background = Brush("#17A673");
                    return;
                }
                if (completedOperation == SetupOperation.Install)
                    selectedOperation = SetupOperation.Repair;
                SetBusy(false);
                RefreshState();
                stateText.Text = completedOperation == SetupOperation.Update
                    ? "UPDATE ABGESCHLOSSEN"
                    : completedOperation == SetupOperation.Repair
                        ? "REPARATUR ABGESCHLOSSEN"
                        : "INSTALLATION ABGESCHLOSSEN";
                titleText.Text = "Bereit für die Forschungsarbeit.";
                descriptionText.Text = completedOperation == SetupOperation.Repair
                    ? "Die Programmdateien wurden repariert. Forschungsdaten und Einstellungen sind erhalten."
                    : "Die Anwendung wurde eingerichtet und kann jetzt mit einem Klick geöffnet werden.";
                stateDot.Background = Brush("#17A673");

                if (Environment.GetEnvironmentVariable("CRCI_NO_LAUNCH") != "1")
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
                    ? "Study Tracker und alle lokalen Forschungsdaten wirklich entfernen?"
                    : "Study Tracker entfernen? Lokale Forschungsdaten bleiben erhalten.",
                "Study Tracker deinstallieren",
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
                selectedOperation = SetupOperation.Install;
                SetBusy(false);
                RefreshState();
                stateText.Text = "DEINSTALLATION ABGESCHLOSSEN";
                titleText.Text = "Anwendung wurde entfernt.";
                descriptionText.Text = deleteData
                    ? "Programm und lokale Forschungsdaten wurden gelöscht."
                    : "Die Programmdateien wurden entfernt. Lokale Forschungsdaten bleiben für eine spätere Installation erhalten.";
                stateDot.Background = Brush("#17A673");
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
            if (value)
                primaryButton.IsEnabled = false;
            openButton.IsEnabled = !value;
            uninstallButton.IsEnabled = !value;
            closeButton.IsEnabled = !value;
            deleteDataCheckBox.IsEnabled = !value;
            progressBar.Visibility = value ? Visibility.Visible : Visibility.Collapsed;
            progressText.Visibility = value ? Visibility.Visible : Visibility.Collapsed;
            if (value)
            {
                progressBar.Value = 2;
                progressText.Text = "Vorgang wird vorbereitet …";
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
                "Study Tracker Setup",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
    }

    internal static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            bool silentInstall = HasArgument(args, "--silent-install");
            bool silentUpdate = HasArgument(args, "--silent-update");
            bool silentUninstall = HasArgument(args, "--silent-uninstall");
            bool performUninstall = HasArgument(args, "--perform-uninstall");
            bool deleteData = HasArgument(args, "--delete-data");
            bool showResult = HasArgument(args, "--show-result");

            try
            {
                if (silentInstall)
                {
                    Installer.Install(true, (value, message) => { });
                    return 0;
                }

                if (silentUpdate)
                {
                    Installer.Install(false, (value, message) => { });
                    Installer.Launch(false);
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
                                ? "Study Tracker und lokale Daten wurden entfernt."
                                : "Study Tracker wurde entfernt. Lokale Daten wurden beibehalten.",
                            "Deinstallation abgeschlossen",
                            MessageBoxButton.OK,
                            MessageBoxImage.Information);
                    }
                    return 0;
                }

                bool continueInstall = HasArgument(args, "--continue-install");
                SetupOperation preferredOperation = ParseOperation(args);
                if (HasArgument(args, "--uninstall"))
                    preferredOperation = SetupOperation.Uninstall;
                if (continueInstall && preferredOperation == SetupOperation.None)
                {
                    preferredOperation = Product.IsInstalled
                        ? SetupOperation.Repair
                        : SetupOperation.Install;
                }

                Application application = new Application
                {
                    ShutdownMode = ShutdownMode.OnMainWindowClose
                };
                SetupWindow window = new SetupWindow(preferredOperation);

                if (continueInstall)
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
                else
                {
                    window.Loaded += (sender, eventArgs) =>
                    {
                        SetupOperation operation =
                            OperationPicker.Show(window, preferredOperation);
                        if (operation == SetupOperation.None)
                        {
                            window.Close();
                            return;
                        }
                        window.SelectOperation(operation);
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

                if (!silentInstall && !silentUpdate && !silentUninstall)
                {
                    MessageBox.Show(
                        ex.GetBaseException().Message,
                        "Study Tracker Setup",
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

        private static SetupOperation ParseOperation(string[] args)
        {
            const string prefix = "--operation=";
            foreach (string arg in args)
            {
                if (!arg.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                    continue;

                string value = arg.Substring(prefix.Length);
                SetupOperation operation;
                if (Enum.TryParse(value, true, out operation))
                    return operation;
            }
            return SetupOperation.None;
        }
    }
}
